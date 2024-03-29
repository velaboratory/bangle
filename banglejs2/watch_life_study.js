NRF.disconnect(); //disconnect at the start.  This removes issues associated with terminals

  
  { // must be inside our own scope here so that when we are unloaded everything disappears
    // we also define functions using 'let fn = function() {..}' for the same reason. function decls are global

  let readSetting = function(s, default_value){
    var f = require("Storage").read("setting_"+s);
    if(f){
      return JSON.parse(f);
    }else{
      return default_value;
    }
  };
  let writeSetting = function(s,v){
    require("Storage").write("setting_"+s,JSON.stringify(v));
    return v;
  };

  let read_config = function(){
    config = require("Storage").open(config_filename,"r").read(1000000); //stored in base64
    if(config === undefined){ //not there
      config = {}; //stored as object
      require("Storage").open(config_filename,"w").write(btoa(JSON.stringify(config)));
    }else{
      config = JSON.parse(atob(config)); //stored as b64, read back and parse
    }
    return config;
  };
  
    
  let drawTimeout;
  let syncing = false;
  let last_steps = Bangle.getStepCount();
  let last_hrm_reading_time = require("Storage").read("last_hrm_time");
  if(last_hrm_reading_time == undefined){
    last_hrm_reading_time = 0;
  }else{
    last_hrm_reading_time = parseInt(last_hrm_reading_time);
  }

  let app_name = "test_app";
  let app_version = 52;
  let version = app_name+app_version;
  let movement_filename = "healthlog"+version; 
  let acceleration_filename = "accellog"+version;
  let hrm_files_filename = "hrmfileslog"+version;
  let config_filename = "config"+version;
  let goals_filename = "goals"+version;
  let config = read_config();
  let reading_config = false;
  let reading_firmware = false;
  let timezone = -4;
  let max_chunk = 9000; //the esp has a buffer of 25000, so this leaves some room
  let ble_mtu = 768; //this isn't actually the ble mtu, which is locked at 128.  This is 6*128, 
  let from_time = readSetting("from_time", ""+Math.floor(Date.now() / 1000))
  let current_goal = readSetting("current_goal", 5000);
  let next_goal = readSetting("next_goal",current_goal);
  let daily_steps = readSetting("daily_steps", 0);
  let goals_reached = readSetting("goals_reached", 0);
  let bones_eaten = readSetting("bones_eaten", 0);
  let goals_file = require("Storage").open(goals_filename,"a");
  let unsynced_points = readSetting("unsynced_points", 0);
  let num_bones = 0;
  // Dog animation
  let dog_happy_till = 0;
  let make_dog_happy = function(for_time){
    dog_happy_till = Date.now() + for_time;  //5 seconds
    drawScreen();
  }

  //awesome new function that Bryan wrote (requires latest firmware)
  Bangle.on('accelCalc', function(data) {
    if(syncing){
      return; //for now (should do something like heart rate eventually)
    }
    current_acceleration_file.write(btoa(data.accelSampleData));
  });

  Bangle.on('touch', function(button, xy) { 
    if(dog_happy_till < Date.now()){
      make_dog_happy(2000);
    }
  });
  Bangle.on('charging', function(charging) { 
    drawScreen();
  });

  Bangle.on('swipe', function(directionLR, directionUD) { 
    if(directionLR != 0){
      if(!menu_active){
        openMenu();
      }
    }
  });
  
  var imgs = {
    dogs: [
      { //normal beagle
        idle: require("heatshrink").decompress(atob("kcjwkGswA/AHqKHQ5EFqFVAAYFBCI9gokEolUAIUEoAiHBINEAAYFBERVAl//kAiKKANEo32/8koBXJGoMvmEAmwyIGoYyBmM2+0gRhUP/4ADERciAAYiLVpwACgIhCkIQLsBED+DkLgQQC+QiLgFPCIVANBadBCAMkgAiO+wiLgEWGYX2iARJsEzg0DAQUwTh6dMAH4A/VIoA==")),  
        wag1: require("heatshrink").decompress(atob("kcjwkGswA/AHqKHQ5EFqFVAAYFBCI9gokEolUAIUEoAiHBINEAAYFBERVAl//kAiKKANEo32/8koBXJGoMvmEAmwyIGoYyBmM2+0gRhUP/4ADERciAAYiLVpwACgIhCkMGgA0KIgfwsFQCJMCCAXyg0EGpMAp4RCTgKuIGYKdBCAMkCBQiE+1Ah4zKiwzC+0QCBNgmcGgYCCmCcPTpgA/AH6pFA=")),  
        wag2: require("heatshrink").decompress(atob("kcjwkGswA/AHqKHQ5EFqFVAAYFBCI9gokEolUAIUEoAiHBINEAAYFBERVAl//kAiKKANEo3//8koBXJGoMvmEAn4yIGoYyBmM/+0gRhUPGQIACERciAAYiLVo4kJgIhCkIOBgA0JIgfwAwNQCJECCAXyg1giQ0IgFPCIScBocWGZCdBVwUACQJoJEQX2oEPM5MAiwzC+0QCBNgmcGgYCCmCcPeZQA/AH6pHA")),
        sleeping: require("heatshrink").decompress(atob("kcjwkBiIA/AH4A/AATRJCA0QoFEAAUEggDBb44LDolAoH0onwERQNBgkP+n/EQ8AgkA//wCAP/AgJXHiALBBwPwAgIiIiIdCAAJnCERJ2ELgPwERIbBAQKLKEQUBAQTj/AH4A/AHcQA=")),
        walk1:
require("heatshrink").decompress(atob("kcjwkGswA/AHqKHQ5EFqFVAAYFBCI9gokEolUAIUEoAiHBINEAAYFBERVAl//kAiKKANECAP/klAK5NmgX/mEAn/yd5VgEAMxn//+CMKh4RBAAQiLkQADkCvQERRXBEQYQLK4QABKxdmgKLCkIiMgIQB+MAJgIiKoX/+VBgEEqAiJilQgFUiFE+Y2JgMjg0DkJ7LsEfmFgn8QNBcPFwMDX5YiBmcgsEjmAiLIAIUBX5gA/AEVgA=")),
        walk2:       require("heatshrink").decompress(atob("kcjwkGswA/AHqKHQ5EFqFVAAYFBCI9gokEolUAIUEoAiHBINEAAYFBERVAl//kAiKKANECAP/klAK5I1Bl8wgE/kjvKsAhBmM/GoKMKh4yBAAQiLkQADERatOAAUCEQYQLsBED+FgCRUBRYUhgFDCJNggIQB+MAsMwERVC//yoIiMilQgFUiDiIEQcjg0DIoKdLj8wsE/iB5KYAPzg0CmaLMma8BVwIiLBpoA/AEtgA=")),
        walk3:
require("heatshrink").decompress(atob("kcjwkGswA/AHqKHQ5EFqFVAAYFBCI9gokEolUAIUEoAiHBINEAAYFBERVAl//kAiKKANECAP/klAK5NmgX/mEAn/yd5VgEAMxn//+CMKh4RBAAQiLkQADkCvQERRXBEQYQLK4QABKxdmgKLCkIiBEhNggIQB+MAdYIRJgNC//yoMAgkwERMUqEAqkQogQJEQMjg0DkJ7BNBUTkFgn8QNBYdCga/LEokjIZQRFX5gA/AEVgA="))
      },
      { //blonde beagle
        idle: require("heatshrink").decompress(atob("kcjwcBkmSpIC/ATdANAhlGjcN23btuw7ESDQmN4/4v/G/l8hIaEo3j9////un0EEwkjsPw//+m8bgQmEyEA/YZB/eAU49/+EDv/BLg8//8N//gNY8fEwP/+B3HxpoDQZh0FAQVtDQNgTxBBB//4VpBBC/gmJBgP9wIaHmwMB/3AEw8b//2/8AEw8BOoXAWwomCjFtwy2GAQL4LAX4ClkAA==")),
        wag1: require("heatshrink").decompress(atob("kcjwcBkmSpIC/ATdANAhlGjcN23btuw7ESDQmN4/4v/G/l8hIaEo3j9////un0EEwkjsPw//+m8bgQmEyEA/YZB/eAU49/+EDv/BLg8//8N//gNY8fEwP/+B3HxpoDQZh0FAQVtDQNgoBBJ//4kBoFIIn8iOBEw4MB/uA4AmGmwMB/3DEw8b//2/8BEw8BOoXAWwomCjFtwy2GAQL4LAX4ClkAA=")), 
        wag2: require("heatshrink").decompress(atob("kcjwcBkmSpIC/ATdANAhlGjcN23btuw7ESDQmN4/4v/G/l8hIaEo3j9////un0EEwkjsPw//+m8bgQmEyEA/YZB/eAU49/+EDv/BLg8//8N//gNY8fEwP/+B3HxpoDQZkSoIOGtoaBsFJgBBI//4kmAQYpBD/kSgyDFEwIMB/uA/CqFyU2BgP+4cAEw0b//2/8BwJNGgJ1C4AyGEwMYtuGWwwCBfBYC/AUsg")),  
        sleeping: require("heatshrink").decompress(atob("kcjwcBkmSpIC/AX4CPTo0CBwmOn////Hjf/4IaEo8fBgPjx/28AmEkcN2//sOH/fwEwmQg0D/0Gj9/+BBFkdt4/bh/3/kSDQmRGYP/4EAhkJDQlILIdt2EENYt+hMfwBoHyUAgmAgK8/AX4C8kA=")),
        walk1:
require("heatshrink").decompress(atob("kcj4kA///A4Mz+/N0mBiGy80rxnEnPz+2Mzku2sItcT+9hiFP8tAhBj/AH0RAA0QCA8W0OqAAeh0wRHgPiiUu2Ui30iiXhEQ8ekPO8sikvu4MuERE+jmnkUik+sj0xKxPO9lVrgiBK5MAiUi0kU0UiB5I1BGQM3mUikKMKEQIADERdmAAdhV6AiKgHWEQfQCBUEIYVYkjkL6oQBqvCoAQKhvuqUs4XtJgIRJ73sEYPu6NF0IiJ8UxiMyknu5RqJoXDiETkVBPZUEx0xgM4NBlCxIiBrBoMmexgOznoiLXgLVBX5gA/AEYA==")),
  walk2:
require("heatshrink").decompress(atob("kcj4kA///A4Mz+/z+3P4uBiGy80rxnEnOMzku2uknMT+8ggFhiFP8pj/AH0RAA0QCA8X1uqAAet04RHgNC6UkuUiuki6VBEQ8UlvP+0ik3/5skERGv7mokUilGs7+hKxPP/lmtn/4JXJgESkWliuikQPJGoIyB1AQBkKMKEQIADERd3AAdxV6AiKgHnEQfgCBUFIYUmmsBEZXmCAUyrtJCJMO/9ikUy/0IaJAAB9/8EYP/9tkERXy0MR0Ul/RFKqXKiEa4VRCBUFn+RgOmmp5KEQM5iEX1SLLh2ZXgKuBERYNNAH4AmA")),
        walk3:
require("heatshrink").decompress(atob("kcj4kA///A4Mz++BiGy80rxnEnPN0mMzku2vP4sT+/qwdhiFP8vz+xj/AH0RAA0QCA8VyOZAAeRyoRHgOiiUq4Ui5UiiWhEQ8akO+8kiknu2MqERF+jeWkUik2bj1xKxO+9dEpYiBK5MAiUiycTyUiB5I1BGQN2uUikKMKEQIADERdVAAdRV6AiKgHVEQfQCBUDIYVPkbkL6gQBomymEAGpMN91Cley9sAs4RJ73rEYPu6M0yIiJ8VxiNykfuehAABmX1iEX2UxiIQJhupqMBunzNBaZBgEXkRoBABkB499CBoRBX5gA/AEY")) 
      },
      { //doberman
        idle: require("heatshrink").decompress(atob("kcj4cA///A4PDjHHzVGvWkrNmwWCiBT/AD0JkmSpICBpAMFn+f6v/6v5/mABgkUxQYD0lABgkKos3iVR2lSkAMEgsi+Vt22zlKaFgVJpu27dtiRBGgGm88+m2ILg9Wt0o71EBg8po3buMiBg8f6u2NAKDMOgoAC+tt2tyTxFS1u6yIMIlNW7tIExGkyt1khoIqSqCNBJOCNBH0LQWXWwoABs/00mN/y2FAAL4LAH4AmA")),
        wag1: require("heatshrink").decompress(atob("kcj4cA///A4PDjHHzVGvWkrNmwUFuRT/AD0JkmSpICBpAMFlMUytJqmRpGABgkUxQYD0lABgkKos36Vd2lSkAMEgsi+Vt22zlMQBgkCpNN23btsSII0A035k+2xBcHq1v13eogMHlNG7dxkQMHNAO26mRQZh0FAAWltu1kUJBg9S9u+yMFNApBCq3dpGCLg+kyt1kmJLg9SVQVFExBOCkQmHyhaCyK2FAANiqmkxtKEw74LAH4Am")),
        wag2: require("heatshrink").decompress(atob("kcj4cA///A4PDjHHzVGvWkrNmwUFuRT/AD0JkmSpICBpAMFlMUytJqmRpGABgkUxQYD0lABgkKos36Vd2lSkAMEgsi+Vt22zlMQBgkCpNN23btsSII0A035k+2xBcHq1v13eogMHlNG7dxkQMHNAO26mRQZmAhANG0tt2omBkgMGqXt3wmBiSDFIINW7qbBpSDFgGkyt1kmJVQwmBVQVFExBOCkSDHyhaCyIyGgFiqmkxtKWwoABfBYA/AEw")),
        sleeping: require("heatshrink").decompress(atob("kcj4cA///A4PDjHHzRL/AH4AakmSpICDyAMEilSBIOKlMkxAMEhQIByVFimSogMEgsU7dN2WKpMiBgkCpUl21KDoORIIsFk3LtImBpGADQuTtu0xMkylABgkBLIekyMgE4umoEtiRoHgFJkESpC6/AH4A9A=")), 
        walk1:
require("heatshrink").decompress(atob("kcj4cA///A4PDjHHzVEnOkrOCiEFuRT/AD0JkmSpICBpAMFncd0vbrOx7GABgkUxVKkmipGkoAMEhVFm/Sru0qUgBgkFkWatu2zUpiAMEgVJBYPbtpBHgGo/073GILg9Ut+u7lEBg8po3buMiBg8dyu26uxQZh0FAAXltu1sSeIqlt28RBhEpq3dpAmIimVuskoEkBg0KYYUk1iqFTwMspPJimWVQqeBBAPkxJcHgNLiFyR5EA5GIlVCBhF/wkZ/IMIkmQgKPJAH4AKA")),        
        walk2:
require("heatshrink").decompress(atob("kcj4cA///A4PDjHHzWkrOCiEFuVmwRT/AD0JkmSpICBpAMFm2bqm24tp2mABgkUxQYD0lABgkKos3yVZ2lSkAMEgsi3Vt226lMQBgkCpILB7dtII8A0n1m80xBcHqXvln6ogMHlNG7dxkQMHjdUyVFtKDMOgoAC6skyNSTxFUtu3iMEDQ5BB7lIzZoHimUuMkoJcHhSqCkpcHgsqpOpiiDHgWVkHUxK2FAAMBpWQqSPIgHIxEzsQMIu2EZAIMIkmQBRAA/ABgA==")),        
        walk3:
require("heatshrink").decompress(atob("kcj4cA///A4PDjHHzWkrOCiEFuVmwRT/AD0JkmSpICBpAMFm2bqm24tp2mABgkUxQYD0lABgkKos3yVZ2lSkAMEgsi3Vt226lMQBgkCpILB7dtII8A0n1m80xBcHqXvln6ogMHlNG7dxkQMHjdUyVFtKDMOgoAC6skyNSTxFUtu3iIMIIIPcpGAhAMGimUuMkoE0Go0KVQUk1SqFTwMqpOpimREw0CyUg6mJkgMGgP+iFqR5EAyVAlVCBhAABjOxBhUBR5IA/ABQ"))
      },
      { //husky
        idle: require("heatshrink").decompress(atob("kcj4kA///A4IDBlFC221Jv4A/ACcBiIAHCI8TmMzAAYFBiAiHmcTCIgYBETYMBkYCBERJPBmciAAISBiIiHGoUikMRCIIPJGoIgBkICCRpUSGYQABERoACERasFERQ0FCBcBolERgTlLikzmUiogiLiAgBNB1CB4TRBERSuBCQJIBERURIYIABkEhCJJnBiUSmkQiQ0KTgqdMAH4A/AAoA==")),
        wag1: require("heatshrink").decompress(atob("kcj4kA///A4IDBlFC221Jv4A/ACcBiIAHCI8TmMzAAYFBiAiHmcTCIgYBETYMBkYCBERJPBmciAAISBiIiHGoUikMRCIIPJGoIgBkICCRpUSGYQABERoACERasFERQ0FiASKgNEoiMCgKLIAAMUmcykVEiETERMQEAI0CiIiJgNCB4TRBGZSuBCQJIBGZURIYIABkEhM5cSiU0iESGZScFTpgA/AH4AF")),
        wag2: require("heatshrink").decompress(atob("kcj4kA///A4IDBlFC221Jv4A/ACcBiIAHCI8TmMzAAYFBiAiHmcTCIgYBETYMBkYCBERJPBmciAAISBiIiHGoUikMRCIIPJGoIgBkICCRpUSGYQABERoACERasFEQIkJGggOBNJMBolERgQGBoIiIikzmUiokQgMSEREQEAI0CiM0GZNCB4TRBV4KuKCQJIBiZnJiJDBAAMgkIQJM4MSiRBBiTzITg7zKAH4A/AA4A==")),
        sleeping: require("heatshrink").decompress(atob("kcj4kA///A4IDB221lFCJv4A/AH4AZiIAICA0BoNEAAUUiUkkUQCI0UigQCoNBCAMhER0iERERikREIIQBmUkmJXHgNEoUSCQMimQiIgAuCAAJnCERJ2EiczmIiIidBNgMxRZQiCiACCcf4A/AH4A8A=")),
        walk1:
require("heatshrink").decompress(atob("kcjxH+AH4A/AH4A9gAAPEKMrlYCCABAODEX4ibAQOB6+BBAoiSAAUrq1W64ADAwIfBV6YlCEAWsDQWsEgQfTEQZBDMwJqBAAQibAAwiXwIAJES4ALESpGKEK4iB1gABRThFDq1WZ4QFCETPXIoZoGRyr1FwImCD4Mr1hKURYJiCAAJoB1ghBqxRBESgbBMQQiBDoT3XNAQiFaLQ+BEUGBQQIiCfALRDESyAFQ64A/AH4A/ABIA==")),
        walk2:
require("heatshrink").decompress(atob("kcjxH+AH4A/AH4A9gAAPEKMrlYCCABAODEX4ibAQOB6+BBAoiSAAUrq1W64ADAwIfBV6YlCEAWsDQWsEgQfTEQZBDMwJqBAAQibAAwiXwIAJES4ALESpGKEK4iB1gABRQ5HWIoNWqzPCAoQgBAgIjUaQJFDNAsr1giWAAeBEwRFBqwiW1hiDMYQeBlcrRawbBMQQiBN4L1YNAQiFaIT0XHwIiDJYKHVegsrdQZlCETIbaAH4A/AH4AMA")),
        walk3:
require("heatshrink").decompress(atob("kcjxH+AH4A/AH4A9gAAPEKMrlYCCABAODEX4ibAQOB6+BBAoiSAAUrq1W64ADAwIfBV6YlCEAWsDQWsEgQfTEQZBDMwJqBAAQibAAwiXwIAJES4ALESpGKEK4iB1gABRThFDq1WZ4QFCEQYmUaQJFDNA0rE4j1VwImCVwMrFwIiU1hiCAAJrCEINWEKgiBC4JiCa4QeBey5FCEQhjVEQo7ENAgiXNw7REEbqIXAH4A/AH4AI"))
      },
      { //chocolate lab
        idle: require("heatshrink").decompress(atob("kcj4kA///4+aI/4A/ADMCkQAHCI8hiURAAYFBkAiHiMhCIgYBETYSCAQIiJJ4IiFkQiHGoQNCCIIPJGoQyCAQKNKNAoiNIoYiKVgoiKGgoQLGggzLESJoiESDRGCJL1CEgICBGhScFTpgA/AH4AF")),
        wag1: require("heatshrink").decompress(atob("kcj4kA///4+aI/4A/ADMCkQAHCI8hiURAAYFBkAiHiMhCIgYBETYSCAQIiJJ4IiFkQiHGoQNCCIIPJGoQyCAQKNKNAoiNIoYiKVgoiKGgsgCRQ0EiUCGpQiFkKLLAAciERJoGGZ7RBGZLRGM5chEgICBGZScFTpgA/AH4AFA")),
        wag2: require("heatshrink").decompress(atob("kcj4kA///4+aI/4A/ADMCkQAHCI8hiURAAYFBkAiHiMhCIgYBETYSCAQIiJJ4IiFkQiHGoQNCCIIPJGoQyCAQKNKNAoiNIoYiKVgoiBK5YzENJI0EGYMCGxIiFgUhERBoFRwIzNGgKhBRZwyJMAIiFCBL1CEgICBTpScFeZQA/AH4AHA")),
        sleeping: require("heatshrink").decompress(atob("kcj4kA///A4PHzXimEjoOkrOhkGGxVGvVhiHltMFuVAiEluUCnPClBj/AH4A/AAcRABAQGgO2uUiAANK+8ilEQCI0bs4QCkmvCwOBEQ9ZvGCkWIovnERMBi/klGDnc4EwIiHCINyk9SkUjotV1AiHgEXIoUimMRjIiJ8lEAANJitVqYiIiuhgFq18R+czRY4iBt8Qhn/yDj/AH4A/AHg")),
        walk1:
require("heatshrink").decompress(atob("kcj4UA///4+aBIMFuRK+hWqAAOoBAe+KAP+/AHCgXZqtVrPgBAULsoIBs+ABAUty1VsueEQeqCANWFYkJr2trA9Ekte6tgBAmVDQIqDHoJFCK44qEIwIRBDIgrBHgJyFFYI8FgQzBsGgJwgIB1JxDEQPq61XFgmXxdaHokCr0tL4sJvG1Iosv8RfFRgMCL4oAyA=")),
        walk2:
require("heatshrink").decompress(atob("kcj4UA///4+aBIMFuRK+hWqAAOoBAe+KAP+/AHCgXZqtVrPgBAULsoIBs+ABAUty1VsueEQeqCANWFYkJr2trA9Ekte6tgBAmVDQIqDHoJFCK44qEIwIRBDIgrBHgMoFY1aNAYrBGYNiNAZOBBAOnEYkl9XWK4uXxdaJwtelpfFhN435FFl/g1S4FAwwAzA=")),
        walk3:
require("heatshrink").decompress(atob("kcj4UA///4+aBIMFuRK+hWqAAOoBAe+KAP+/AHCgXZqtVrPgBAULsoIBs+ABAUty1VsueEQeqCANWFYkJr2trA9Ekte6tgBAmVDQIqDHoJFCK44qEIwIRBDIgrBHgMoFY1aNAYrBGYNiNAZOBBAOnEYkl9XWK4uXxdaJwtelpfFhN435FFl/g1S4FAwwAzA="))
      },
      { //dalmation
        idle: require("heatshrink").decompress(atob("kcjwcBkmSpIC/ATdANAhlGgEP//nx/4gESDQmAg/8v/H/kAhImFgf/AAP+gEEEwkggP4BYM/gECEwmQgAZC/+AU49/8ECv/BLg8//0J//gNY8fEwXwO4+OnAMB/CDMOgoCCQYImJyRcB/04VpEAvySBExF/EwOPNBE4/l+gBoIgC2BR4ImHgJ1C4C2FR4UQv/Ej+CEw74KAX4ClkAA==")),
        wag1: require("heatshrink").decompress(atob("kcjwcBkmSpIC/ATdANAhlGgEP//nx/4gESDQmAg/8v/H/kAhImFgf/AAP+gEEEwkggP4BYM/gECEwmQgAZC/+AU49/8ECv/BLg8//0J//gNY8fEwXwO4+OnAMB/CDMOgoCCQYImBoAaHLgP+nEjwQaGgF+SQMRLg9/EwOP4BcHnH8v0A8YmIWwP/wImHgJ1C4C2FR4UQv/Ej4mIfBQC/AUsg")), 
        wag2: require("heatshrink").decompress(atob("kcjwcBkmSpIC/ATdANAhlGgEP//nx/4gESDQmAg/8v/H/kAhImFgf/AAP+gEEEwkggP4BYM/gECEwmQgAZC/+AU49/8ECv/BLg8//0J//gNY8fEwXwO4+OnAMB/CDMiVBBwyDBEwUADQxcB/04RIKDFCgN+SQMSg6DFNAImBx/ABwImFnH8v0A8YmIWwP/wKDHgJ1C4AyGR4MQv/Ej+CQYz4LAX4ClkA")),
        sleeping: require("heatshrink").decompress(atob("kcjwcBkmSpIC/AX4CPTo0CBwmAn////AjkP4IaEoEfBgPgh/HgAmEkEPBgPwg//wAmEyEHgf+g8cv04IIsj//H/+P4/8iQaEyImBIIMAh0JDQlILId//EENYt+hMfwBoHyUAgmAgK8/AX4C8kAA=")),
        walk1:
require("heatshrink").decompress(atob("kcjxH+AH4A/AH4A9gAAPEKmsABIjTCYfX6+sqwDBwOsAYPXETIAIETGslYfElZHBIuwlDDQWfDQWfEQb2WDQXJvUrvXJETvQAAYiawIAJES4ALESpGKEK6MEAAdW1giZqwiF1itXEQUrDwOBlcrEIIiDRypoHEQQtCSCgiCC4IABwIiCNwYiU1krHQQiBNQL3YLoNWEQaNCejZFEVwgiWvV6qAiCqAGBETKAFQ64A/AH4A/ABIA=")),
        walk2:
require("heatshrink").decompress(atob("kcjxH+AH4A/AH4A9gAAPEKmsABIjTCYfX6+sqwDB69W1gDBETIAIETGslYfElZGBIuwlDDQWfDQWfEQb2WDQXJvUrvXJETvQAAYiawIAJES4ALESpGKEK6MEAAdW1giBI60AqwiF1itBgGsJKsAlYeBwMrlYhBaAQFBESpoGEQQKBETBeBAAOBEQQhWEQOslaBCEQJkCeq6LBqwiDkiHWNBDXCz+fETN6vVQDgRlCETIbaAH4A/AH4AM")),
        walk3:
require("heatshrink").decompress(atob("kcjxH+AH4A/AH4A9gAAPEKmsABIjTCYfX6+sqwDB69W1gDBETIAIETGslYfElZGBIuwlDDQWfDQWfEQb2WDQXJvUrvXJETvQAAYiawIAJES4ALESpGKEK6MEAAdW1giZqwiF1itEEykAlYeBwMrlYhBEQcrNqhoHEQQtCNqkA1g6CAAOBEQRtCNCskp5dCEQJqBezEA0ulvQiCRoTRZHYhoEES4oGqF6JYQjeRC4A/AH4A/ABAA="))        
      }, 
      { //blue healer
        idle: require("heatshrink").decompress(atob("kcj4kA///A4NP8vDjGLxcooXO4koweCiGu3mLpXlsNM2mO3miiFKpRj/AH0RAA0QCA8YwOIAAYFBCI8BmcTmezAIUTmIiHBIMzmdaqczAoIiKm861U3ERRQBEIOq1VTmJXJGoO2qMRq2zB5I1B2UmqdWkWxRhUSkUtpsikQiLu4ADuKvQERUAi4iDCBcBoRDBkVBchcfCIVPERcVr4RBp9VNBdVCIIQBqIiLqoADERUYqv1B4P1rARJgPFmnlqvkmvBTh6dMAH4A/AAo")),
        wag1: require("heatshrink").decompress(atob("kcj4kA///A4NP8vDjGLxcooXO4koweCiGu3mLpVM2mO3miiHHnPlsJj/AH0RAA0QCA8YwOIAAYFBCI8BmcTn3zmf+AoMxEQ4JBmcz9XjmYFBERU39Wq84iKKAIhB1Wq8cxK5I1B+1RiNW+YPJGoPyk1Tq0i+KMKiUillMkUiERd3AAdxV6AiKgEXEQcQiI0KoRDBkVBgKLIAAMVCIVFiEeGpMeqoRBoteiPhGZNVCINFqtRCBIzBCIIACiozJjFV0oPB0tYCBMB30073u6k+2KcPTpgA/AH4AFA=")),
        wag2: require("heatshrink").decompress(atob("kcj4kA///A4NP8vDjGLxcooXO4koweCiGu3mLpVM2mO3miiHlsPHnJj/AH0RAA0QCA8YwOIAAYFBCI8BmcTn/jmfvAoMxEQ4JBmcz/XzmYFBERU3/Wq+4iKKAIhB1Wq+cxK5I1B81RiNW8YPJGoPik1Tq0i8KMKiUillMkUiERd3AAdxV6AiBEhMXEQYOBiI0JoRDBkVBgEIRhEAioRCosQgPfGhEfqoRBotfiP/wAzIqoRBotVqPxIpMVCIIACipnJjFV0oPB0tYCBMB3807//6k/2KcPeZQA/AH4AH")),
        sleeping: require("heatshrink").decompress(atob("kcj4kA///A4PDjFP8vu5mLpUmrXN5mKzcJoUt1mCiHLzdBhHFpNLvZj/AH4A/AAcRABAQGgO9kQAC7fZqtZiARGjfSCAUt3uVquREQ+xlcuyW77clERMBiXurNe8QzBERARBsc/9Uz4UpzOZEQ8Aikzp8zmfhiMdERNms3ms1iiWZ8QiIjGBgEox0RNgKLHEQMuiEL92wcf4A/AH4A8A")),
        walk1:
require("heatshrink").decompress(atob("kcj4kA///A4NP8vDjGu3kooUoweO3lllNnsUggGCiEDlPGoOiiFLvZj/AH0RAA0QCA8b2O75u73vLAoIRHgMzicz4YBCicxEQ4JBmYADAoIiK5M4rE54YiJKAMznFVrAiBK5I1BntajVdGRA1DnMkqdUlIyIAAUZkUn+8ilIiLswADsKvQERUA0wiD0AQKhciAAUrchevCAUvERcKr4QCrRMBCJOlCIMvquh0uBERNVwMRwtaYYJqJ0oLBjAiBPZQiCgIiBNBYiENBmImMBnGKERa8BaoK/MAH4AjA==")),
        walk2:
require("heatshrink").decompress(atob("kcj4kA///A4NP8vDjEoweu3kooWO3lllOCiFnsUggEDlPGoOiiFLvZj/AH0RAA0QCA8ZyOZ5uZzvJAoIRHgMzicz4YBCicxEQ4JBmYADAoIiK5U4tE64YiJKAMznFmtAiBK5I1BntrjdtGRA1DnUlsdllQyIAAUakUn+8ilQiLogADoKvQERUA2giD2AQKhMiAAUpgIjK34QCl+x7ARJhdvCAVrhPRERO2CIMvs2xtoiKs2BiOGtdmIpW2tEQjAiBCBQiCgIiBPJQiDjndRZcLxDfBVwIiLBpoA/AEw=")),
        walk3:
require("heatshrink").decompress(atob("kcj4kA///A4NP8vDjEoweu3kooWO3lllOCiFnsUggEDlOiiFLvdIpRj/AH0RAA0QCA8ZyOZ5WZzXJAoIRHgMzicz4YBCicxEQ4JBmYADAoIiK5U4/E64YiJKAMznH//AiBK5I1Bm37jf2GRA1DnUl+f1lQyIAAUakUn88ilQiLogADoKvQERUA2giD2AQKhMiAAUpche+CAUuEQI1Jhf+CAX7gGYCJO/CIMu/+x22BERP/wMRx/7/9hIpO//EQjAiBiIQJhdmwMBEQJoLTIMAEQKLLYYc4xYQNCIK/MAH4Aj"))
      },
      { //german shephard
        idle: require("heatshrink").decompress(atob("kcj4kA///A4Or1YFBlFCJv4A/ACcBiIAHCI8SmMiAAchkcQEQ8yiUiAIcTkIiHiYiGmYiJDgIPBoMjERJPBmQQBklEoMREQ41CmUxiNEogPJGoMzmlBCANBRpUTBwIACERYQEERasFERQ0BmYABmAQLgMiCAMyRJAiEkUjmTPIAAcUoaeBPoJoMCIMzNBkUoUjmcjRZcRoZoCmdBCJMBkcSPYICBNJScFTpgA/AH4AFA")),
        wag1: require("heatshrink").decompress(atob("kcj4kA///A4Or1YFBlFCJv4A/ACcBiIAHCI8SmMiAAchkcQEQ8yiUiAIcTkIiHiYiGmYiJDgIPBoMjERJPBmQQBklEoMREQ41CmUxiNEogPJGoMzmlBCANBRpUTBwIACERYQEERasFERQ0BmYABmEQCRUBkQQBmUhgI1KicikcyZ4MUERMUoaeBPoMRERJoBCIMzNAIzKilCkczkdEiYzJiNDNAUzoJnKkcSPYICBeZCcHTpgA/AH4AF")),
        wag2: require("heatshrink").decompress(atob("kcj4kA///A4Or1YFBlFCJv4A/ACcBiIAHCI8SmMiAAchkcQEQ8yiUiAIcTkIiHiYiGmYiJDgIPBoMjERJPBmQQBklEoMREQ41CmUxiNEogPJGoMzmlBCANBRpUTBwIACERYQEERasFEQJXKmYABmAOBNJMBkQQBmSJBgI2JicikcyZ4MBiYiIilDTwJ9BiNDGZNECIMzNAKvBGZEUoUjmcjogyJMANDNAUzoIQJgMjiR7BAQLzITg7zKAH4A/AA4")),
        sleeping: require("heatshrink").decompress(atob("kcj4kA///A4Or1YFBlFCJv4A/AH4AZiIAICA0BmMiAAUTikymcQCI0SiQQCkMhmUjmIiHkIiDiUTmYiIiMSiMioMUicjmkhK48BEAMUolBmcjEREAFwNEAAJnCoIiIOwkUmcxEREUHwMSoKLKEQUQAQTj/AH4A/AHgA=")),
        walk1:
require("heatshrink").decompress(atob("kcj4cA///A4Or1YFBlFCqutjfvhOTKf4AehMkyVJAQNIBgsyz53B//5+mABgkbpQYD8lABgkOsonDr0gBgkHkW5pMuvcvyAMEgVJC4OUyUSII0A29pk1JhBcHr2yjMkwgMHmxOCoQMHC4JOBkKDMOgoAC7dt23STxFrBgPpBhE623b3gmIj2rut4oEkBg0MxMs0kk5CqFgEGpFJ28ZjqqFgEDy8g63JLg8Bt2QtdkJxHnpE3mQMIsvkj5oJkmQgKPJAH4AKA")),        
        walk2:
require("heatshrink").decompress(atob("kcj4cA///A4Or1YFBlFCquthOTwUQKf4AehMkyVJAQNIBgsyzu27dt2PUwAMEjdKDAe0oAMEhtlE4ddkAMEg2i29Jlvzl6aFgVJtMkymSiRBGgG3tMmpMILg9b2V5kmEBg825JCBoQMHjJOCkKDMOgoABgaBB23eDI8B9YMB98EDQ/uToO4zJoHjmrutoo+kBg0MxMq0kmLg8GpFJ2v5QY8O60g635WwoABg9uyFrvhbHge3pErrwMHgFl4jIBBhEkyAKIAH4AMA")),        
        walk3:
require("heatshrink").decompress(atob("kcj4cA///A4Or1YFBlFC8cojfvhOTKf4AehMkyVJAQNIBgszj53B//59GABgkcxQYD8lABgkOsonDr0gBgkHkX9pMvvcvyAMEgVJtMkymSiRBGgG2yMmpMILg9e6VZkmEBg86JwVCBg8btu27dpQZh0FAAWkBgMiTxFzE4PxBhEjm3b7WALg8Y2d5v1Amg1GhmJlmkk28VQsAg1IpOSjMxEw0Dy8g8upkgMGgOZiFzuhOIyVAnc6BhAABj/RBhUBR5IA/ABQ"))        
      }
    ],
    dog_bowl_empty: require("heatshrink").decompress(atob("kcjwkCkQA/AH4A/AAjOEZZQMB5gADCRIPB4MRAAUcCQIPFkEMB4gSD4AkFgfMCA0R5nAEQs0IAIzF5lEEQsM4lMKwnMA4IiGngaBCQfEogDBEQkgIoItCAAQlDCIgQDAA40EGYQAJESwQKEQgQMCIkMCBY0DEUcAABbSFAH4AkkA")),
    dog_bone: require("heatshrink").decompress(atob("kcjwkBiIA/AH4AxgAGMAAUP+DOEgPwCJP/AAgQKEQoGBIrIA/AH4A/AH4A/ADMQA")),
    heart: atob("CgrBAP//APgACEc5/n+Pw/B4DAAA")
  };
  
  var currentframe = 0;

  let sync_files = [];
  let current_hrm_file = null;
  let current_hrmraw_file = null;
  let current_movement_file = require("Storage").open(movement_filename,"a"); //this can stay on
  let current_acceleration_file = require("Storage").open(acceleration_filename,"a"); //this can stay on
  let debug = false;
  let last_bpm = 0;
  let last_conf = 0;
  E.setTimeZone(timezone);
  Bangle.setOptions({"powerSave": true, "hrmPollInterval": 20, "lockTimeout": 10000, "backlightTimeout":3000,"wakeOnBTN1":true,"wakeOnBTN2":true,"wakeOnBTN3":true,"wakeOnFaceUp":false,"wakeOnTouch":false,"wakeOnTwist":false});
  Bangle.setHRMPower(false,"myApp"); //this actually resets the poll interval
  Bangle.setHRMPower(true,"myApp");
  Bangle.setHRMPower(false,"myApp"); 
    
  let dt = new Date();
  let date_string = dt.getFullYear() + "/" + (dt.getMonth() + 1) + "/" + dt.getDate();
  let current_day = readSetting("current_day", date_string);
  
  menu_active = false;
  
  var goal_log_buffer = new ArrayBuffer(6);
    var menu = {

    //"Start HRM":function(){
    //  if(!Bangle.isHRMOn()){
    //    startHRMonitor();
    //  }
    //},
    //"Stop HRM": function(){
    //   stopHRMonitor();
    //},
    "Set Goal": {
                  value: next_goal,
                  min:5000,
                  max:25000,
                  step:500,
                  onchange: v=> { 
                    next_goal = writeSetting("next_goal",v);
                    view = new DataView(goal_log_buffer);
                    view.setUint32(0, Math.floor(Date.now() / 1000), false); 
                    view.setUint16(4, next_goal, false);
                    goals_file.write(btoa(goal_log_buffer));
                    closeMenu();
                  }
    },
    "Show Stats": function(){
      watch_points = unsynced_points + Math.floor(((goals_reached > 0)?current_goal/300:0) + (daily_steps/300) + ((daily_steps > 1000)?10:0));
      E.showPrompt("ID: " + config.id + "\nLevel:" + config.dog_level +"\n" + "Bank: " + config.current_points + "\nWatch: " + watch_points,{buttons: {"OK":0}}).then(function(v) {
        closeMenu();
      });
    },
    "Exit": function(){
      closeMenu();
    }

  };

let openMenu = function(){
      if(menu_active){
        return;
      }
    E.showMenu(menu);
    menu_active = true;
  };
  let closeMenu = function(){
    if(!menu_active){
      return;
    }
    menu_active = false;
    E.showMenu();
    draw();
  };



  var movement_log_buffer = new ArrayBuffer(9);

  
  let writeMovementLog =function() {
      
      var time = Math.floor(Date.now() / 1000);
      var steps = Bangle.getStepCount();
      var movement = Bangle.getHealthStatus().movement;
      var delta = steps - last_steps;
      
      last_steps = steps;
      last_movement = movement; 
      view = new DataView(movement_log_buffer);
      view.setUint32(0, time, false); // byteOffset = 0; litteEndian = false
      view.setUint16(4, delta, false);
      view.setUint16(6, movement, false);
      var battery = E.getBattery();
      var charging = Bangle.isCharging();
      var combined_battery_charging = charging?(128+battery):battery;
      view.setUint8(8,combined_battery_charging,false); //padding
      current_movement_file.write(btoa(movement_log_buffer));
      daily_steps = writeSetting("daily_steps",daily_steps+delta);

      

      if(daily_steps > (goals_reached+1)*current_goal){
        drawBowl(); //the first time, show all bones
        Bangle.buzz(500,1);
        setTimeout(function(){Bangle.buzz(500,1);bones_eaten++;drawBowl();},1000); //eat bones
        setTimeout(function(){Bangle.buzz(500,1);bones_eaten++;drawBowl();},2000); 
        setTimeout(function(){Bangle.buzz(500,1);bones_eaten++;drawBowl();},3000);
        setTimeout(function(){Bangle.buzz(500,1);bones_eaten++;drawBowl();},4000);
        setTimeout(function(){Bangle.buzz(500,1);bones_eaten++;drawBowl();writeSetting("bones_eaten",bones_eaten);},5000);
        make_dog_happy(5000);    
        goals_reached = writeSetting("goals_reached",goals_reached+1);
        
      }
  };

  // let accel_log_buffer = new ArrayBuffer(18);
  // let accumulated_movement = 0;
  // let last_diff = 0;
  // let accumulated_jitter = 0;
  // let num_samples = 0;
  // let last_sample_time = 0;
  // Bangle.on("accel", function(data){
  //   if(syncing){
  //       return; //for now (should do something like heart rate eventually)
  //   }
  //   var time = Math.floor(Date.now() / 1000);
  //   num_samples++;
  //   accumulated_jitter += Math.abs(data.diff - last_diff);
  //   last_diff = data.diff;
  //   accumulated_movement += last_diff;

  //   if(time - last_sample_time > 60){
  //       last_sample_time = time;
  //       var view = new DataView(accel_log_buffer);
  //       var time_s = Math.floor(time);
  //       view.setUint32(0,time_s);
  //       view.setUint32(4,Math.floor(accumulated_movement*1000)); 
  //       view.setUint32(8,num_samples); 
  //       view.setUint32(12,Math.floor(accumulated_jitter*1000)); 
  //       //+2 so we fall on the 3 boundary
  //       current_acceleration_file.write(btoa(accel_log_buffer));
  //       accumulated_movement = 0;
  //       accumulated_jitter = 0;
  //       num_samples = 0;
  //   }
  // });
  
  // var hrm_log_buffer = new ArrayBuffer(6);
  // Bangle.on("HRM", function(hrm) { 
        
  //       var view = new DataView(hrm_log_buffer);
  //       var time = Math.floor(Date.now() / 1000);
  //       view.setUint32(0,time);
  //       view.setUint8(4,hrm.bpm); //0 - 100
  //       view.setUint8(5,hrm.confidence); // 0-100
  //       last_bpm = hrm.bpm;
  //       last_conf = hrm.confidence;
  //       if(current_hrm_file != null){
  //           current_hrm_file.write(btoa(hrm_log_buffer));
  //       }
  //       drawWidgets();
  // });

  let last_time = 0;
  var hrm_raw_log_buffer = new ArrayBuffer(3);  //might be able to go down to 3 or even 2
  Bangle.on("HRM-raw", function(hrm) { 
        var time = Date.now()/1000;
        if(time-last_hrm_reading_time > 10){
            stopHRMonitor();
            //drawWidgets();
            return;
        }
        var view = new DataView(hrm_raw_log_buffer)
        view.setUint16(0,hrm.raw);
        if(hrm.isWearing == false){
            view.setUint8(2,0); //write a 0 to the time delta when not wearing
            if(current_hrmraw_file != null){
              current_hrmraw_file.write(btoa(hrm_raw_log_buffer)); //add to the buffer
            }
            stopHRMonitor();
        }else{
          var time_ms = Date.now();
          var time_delta = time_ms - last_time;
          if(time_delta > 254){
              time_delta = 255; //how often is this happening?
          }
          last_time = time_ms;
          view.setUint8(2, time_delta); 
          //view.setUint8(2, acc); 
          if(current_hrmraw_file != null){
              current_hrmraw_file.write(btoa(hrm_raw_log_buffer)); //add to the buffer
          }
        }
  });

  let startHRMonitor = function(){
    if(syncing){ //we don't want the HR monitor to start if we are actively syncing
        return;
    }
    //generate a new filename
    
    tms = Math.floor(Date.now()); //time in milliseconds
    var hrmraw_filename = "hrmraw"+version+"_"+ tms;
    //var hrm_filename = "hrmreg"+version+"_"+ tms;
    //current_hrm_file = require("Storage").open(hrm_filename,"a");
    current_hrmraw_file = require("Storage").open(hrmraw_filename,"a");
    //we write these names to storage, because we have to remember to sync them
    //require("Storage").open(hrm_files_filename,"a").write(hrm_filename+"\n");
    require("Storage").open(hrm_files_filename,"a").write(hrmraw_filename+"\n");

    Bangle.setHRMPower(true,"myapp");
    last_hrm_reading_time = Math.floor(Date.now()/1000); //time in seconds
    require("Storage").write("last_hrm_time",""+last_hrm_reading_time);
    last_bpm = -1;
    last_conf = -1;
    //drawWidgets();

  };

  let stopHRMonitor = function(){
    Bangle.setHRMPower(false,"myapp"); //this should immediately stop raw readings
    drawWidgets();
  };

  let drawWidgets = function(){

        var w = g.getWidth();
        var h = g.getHeight();
        var cx = w/2;
        var cy = h/2; 
        g.clearRect(0,0,w,20); //reserve 20 pixels
        if(Bangle.isHRMOn()){
            if(last_bpm >= 0 || last_conf >= 0) {
                g.setFontAlign(0, 0).setFont("6x8", 2).drawString(last_bpm+":"+last_conf, cx, 10);
            }
            else{
                g.setFontAlign(0, 0).setFont("6x8", 2).drawString("<3 on", cx, 10);
            }
        }
        g.setFontAlign(1, 0).setFont("6x8",2).drawString(""+E.getBattery()+"%", 170, 10);
        g.setFontAlign(-1, 0).setFont("6x8",2).drawString(""+daily_steps +"/"+(goals_reached+1)*current_goal, 5, 10);
  };

  bone_area_rect = [90,30,175,60]
  let drawBones = function(n){
    if(config.dog_name == undefined){
      return; //no dog drawing if no pet name
    }
        metrics = g.imageMetrics(imgs.dog_bone);
        scale = 2.5;
        w = metrics.width*scale;
        h = metrics.height*scale;
        x = 95; //top left
        y = 45;
        
      
      for(var i =0;i<n;i++){
        g.drawImage(imgs.dog_bone,x-(10*(i%2)),y-10*(i),{scale:scale} ); 
      }
        
  };

  let drawBowl = function(){
    if(config.dog_name == undefined){
      return; //no dog drawing if no pet name
    }
    metrics = g.imageMetrics(imgs.dog_bowl_empty);
    scale = 2.5;
    w = metrics.width*scale;
    h = metrics.height*scale;
    x = 90; //top left
    y = 40;
    if(!menu_active){
        //g.clearRect(x,y,x+w,y+h/2);
        g.drawImage(imgs.dog_bowl_empty,x,y,{scale:scale} );
        for(var i=0;i<goals_reached;i++){
          g.drawImage(imgs.heart, x+20*i,y-20,{scale: 2});
        }
        num_bones = Math.floor(daily_steps / (current_goal / 5)); 
        drawBones(num_bones-bones_eaten);
    }
    if(config.dog_name!=undefined){
      if(config.dog_name.length < 8){
        g.setFontAlign(0, 0).setFont("4x6", 2).drawString(config.dog_name, x+38, y+55);
      }else{
        g.setFontAlign(0, 0).setFont("6x8", 1).drawString(config.dog_name, x+38, y+55);
      }
    }
  };
  let drawDogTimeout;
  let last_dog_rect = []
  let drawDog = function(){

        if(config.dog_name == undefined){
          return; //no dog drawing if no pet name
        }
        dog_images = imgs.dogs[config.texture_id];
        let frames = [dog_images.wag1,dog_images.wag2];
        let img;
        if(dog_happy_till > Date.now()){
            currentframe = (currentframe + 1)% frames.length;
            img = frames[currentframe];
        }else{
            if(Bangle.isCharging()){
              img = dog_images.sleeping;
            }else{
              img = dog_images.idle;
            }
        }

        metrics = g.imageMetrics(img);
        dog_scale = 4;
        dog_w = metrics.width*dog_scale;
        dog_h = metrics.height*dog_scale;
        dog_x = -20;
        dog_y = 0;
        if(!menu_active){
          // if(last_dog_rect.length > 0){
          //   g.clearRect(last_dog_rect[0],last_dog_rect[1]-10,last_dog_rect[2],last_dog_rect[3]);
          // }
          last_dog_rect = [dog_x,dog_y,dog_x+dog_w,dog_y+dog_h]
          g.drawImage(img,dog_x,dog_y,{scale:dog_scale} ); 
        }

  }
  let drawClockFace = function(){
    var x = g.getWidth() / 2;
    var y = g.getHeight() / 2;
    var screen_size = 175;
    g.reset().clearRect(Bangle.appRect); // clear whole background (w/o widgets)
    var date = new Date(); //timezone aware
    var hour = date.getHours() % 12;
    var minuteStr = (""+date.getMinutes()).padStart(2,"0");

    var timeStr = (hour == 0?"12":(""+hour)) + ":"+minuteStr;
    //var timeStr = locale.time(date, 1); // Hour and minute
    
    // Show date and day of week
    var dow = date.getDay();
    days_of_week = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    var dateStringFull = date.toString();
    var parts = dateStringFull.split(" ");
    var dateStr = days_of_week[dow] + " " + parts[1]+" " + parts[2];
              
    //g.setFontAlign(0, 0).setFont("Anton").drawString(timeStr, x, 165);
    
    

    if(config.dog_name == undefined){
      g.setFontAlign(0, 0).setFont("6x8", 5).drawString(timeStr, x, y);
      g.setFontAlign(0, 0).setFont("6x8", 2).drawString(dateStr, x, y+40);
    }
    else{
      drawDog();
      drawBowl();
      g.setFontAlign(0, 1).setFont("6x8", 5).drawString(timeStr, x, screen_size-20);
      g.setFontAlign(0, 1).setFont("6x8", 2).drawString(dateStr, x, screen_size);
    }


  };

  let drawSyncProgress = function(){
    var w = g.getWidth();
    var h = g.getHeight();
    var cx = w/2;
    var cy = h/2; 
    var left = cx-50;
    var width = 100;
    var height = 30;
    g.clearRect(cx-50,cy-20,cx+50,cy+20);
    g.fillRect(left,cy-height/2,left+(total_sent/total_to_send)*width,cy+height/2); 
  };

   // Actually draw the watch face
  let drawScreen = function(){
    if(!menu_active){
      drawClockFace();
      drawWidgets();
    }

    if(drawDogTimeout != undefined){
      clearTimeout(drawDogTimeout);
    }
    if(dog_happy_till > Date.now()){
      drawDogTimeout = setTimeout(drawScreen,400);
    }
  };

 
  //this is more of an update clock
  let draw = function() {
    if(syncing) return;
    
    drawScreen();
   
    writeMovementLog();
    
    let dt = new Date();
    let date_string = dt.getFullYear() + "/" + (dt.getMonth() + 1) + "/" + dt.getDate();
    if(date_string != current_day){
      //it's a brand new day, update things
      todays_points = Math.floor(((goals_reached > 0)?current_goal/300:0) + (daily_steps/300) + ((daily_steps > 1000)?10:0));
      unsynced_points = writeSetting("unsynced_points", unsynced_points + todays_points); //add to points
      current_goal = writeSetting("current_goal",next_goal);
      daily_steps = writeSetting("daily_steps", 0);
      goals_reached = writeSetting("goals_reached", 0);
      current_day = writeSetting("current_day",date_string);
      bones_eaten = writeSetting("bones_eaten", 0);
    }

    var time = Math.floor(Date.now() / 1000);
    if(time - last_hrm_reading_time > 60*15){ //every 15 minutes, take a 10s hrm reading (really just for wear time)
        startHRMonitor();
    }
    

    NRF.setAdvertising({0x180F:[E.getBattery()]},{name:"VELWATCH"});

    next_draw = 60000 - (Date.now() % 60000)
    // queue next draw
    if (drawTimeout) clearTimeout(drawTimeout); //
    drawTimeout = setTimeout(function() {
    drawTimeout = undefined;
    draw();
    }, next_draw); //force update on the minute
    
  };
  
  let storageFile = null;
  let bytes_sent = 0;
  let total_to_send = 0;
  let total_sent = 0;
  let sendData = function(){
       

        while(true){
            s = storageFile.read(ble_mtu);
            
            if(s!=undefined && s.length > 0){
                Bluetooth.write(s);
                bytes_sent += s.length;
                if(bytes_sent + ble_mtu > max_chunk){
                    return false;
                }
            }else{
                return true;
            }
        
        }
  };

  let sendFile = function(filename){
    if(debug) print("sending" + sync_files[currentFileIndex]);
    Bluetooth.write(filename+":");
    storageFile = require("Storage").open(filename,"r");
  };

  let setupServer = function(){
      NRF.on("connect", function(mac, options) {
        if(debug) print("connection from " + mac);
        
      });

      NRF.on('disconnect', function(reason) { 
          syncing = false;
          reading_config = false;
          reading_firmware = false;
          hrmRawFile = null; //if I interruped a heart rate measurement, we need to restart it.
          draw();
      });
      NRF.setTxPower(8);
      // Change the name that's advertised
      //NRF.setAdvertising({}, {name:"Bangle.js"});
  };
  
  E.setConsole("Terminal", {force: true});
  let config_file_temp;
  let config_file_temp_name = "config_file_temp";
  currentFileIndex = 0;
  let firmware_file;
  Bluetooth.on('data', function(data) {
    if(reading_config){  
        parts = data.split("\n");
        config_file_temp.write(parts[0]);
        if(parts.length > 1){
            var config_file_data = require("Storage").open(config_file_temp_name,"r").read(10000000);
            require("Storage").open(config_filename,"w").write(config_file_data);
            
            config = read_config(); 
            
            if(config.reset == true){
              daily_steps = writeSetting("daily_steps",0);
              current_goal = writeSetting("current_goal",5000);
              goals_reached = writeSetting("goals_reached",0);
              next_goal = writeSetting("next_goal",current_goal);
              bones_eaten = writeSetting("bones_eaten", 0);
            }
            
            reading_config = false;
            Bluetooth.write(3); //got all data
            
        }
    }else if(reading_firmware){
        parts = data.split("\n");
        firmware_file.write(parts[0]);
        if(parts.length > 1){
            print("got everything");
            reading_firmware = false;
            Bluetooth.write(4); //got all data
            firmware_file = require("Storage").open("firmware","r");
            program = atob(firmware_file.read(10000000));
            E.setBootCode(program);
        
        }
    }else{
        if(data.charCodeAt(0) == 1){ 
            bytes_sent = 0;
            if(!syncing) {
                if(debug) print("Starting sync");
                syncing = true;
                currentFileIndex = 0;
                sync_files = [];
                sync_files.push(config_filename);
                sync_files.push(movement_filename);
                sync_files.push(acceleration_filename);
                sync_files.push(goals_filename);
                rawfiles = require("Storage").open(hrm_files_filename,"r");
                while(true){
                    s = rawfiles.readLine();
                    if(s == undefined){
                        break;
                    }
                    s = s.trim();
                    if(s != ""){
                        sync_files.push(s);
                    }
                }

                total_to_send = 0;
                total_sent = 0;
                //go through each sync file and calculate the total to send for progress
                for(var sf=0;sf<sync_files.length;sf++){
                    total_to_send += require("Storage").open(sync_files[sf],"r").getLength();
                }
                
                sendFile(sync_files[currentFileIndex]);
            }


            while(sendData()){ //this will return true only if the read was undefined, meaning the file is done
                //if we are done, go on to the next file
                currentFileIndex++;
                if(currentFileIndex >= sync_files.length){ //we are completely done, so write a 2
                    Bluetooth.write(2);
                    break;
                }else{ 
                    Bluetooth.write(10); //write a new line to indicate we are moving to the next file
                    sendFile(sync_files[currentFileIndex]); //open the next one
                }
            }
            if(currentFileIndex < sync_files.length){
                
                Bluetooth.write(1); //indicate a packet, but not a new file yet
            }

            total_sent += bytes_sent;
            drawSyncProgress();
            if(debug) print(total_sent+"/"+bytes_sent);
            
            
            
        }
        if(data.charCodeAt(0) == 2){
            for(var f=0;f<sync_files.length;f++){
                require("Storage").open(sync_files[f], "w").erase();
            }
            require("Storage").open(hrm_files_filename,"w").erase();
            
            Bluetooth.write(2); //confirm delete
            if(debug) print("files erased");
            
            from_time = ""+Math.floor(Date.now() / 1000); //we need to calculate a new from time
            writeSetting("from_time",from_time);

            //we also need to re-open the movement and acceleration files
            current_movement_file = require("Storage").open(movement_filename,"a");
            current_acceleration_file = require("Storage").open(acceleration_filename,"a");
            goals_file = require("Storage").open(goals_filename,"a")
            unsynced_points = writeSetting("unsynced_points",0); //we synced so no more of this
        }
        if(data.charCodeAt(0) == 3){
            config_buffer = ""; 
            reading_config = true;
            config_file_temp = require("Storage").open(config_file_temp_name, "w").erase();
            config_file_temp = require("Storage").open(config_file_temp_name,"a");
            if(debug) print("config read");
        }
        if(data.charCodeAt(0) == 4){
            print("starting firmware upload");
            firmware_file = require("Storage").open("firmware","w").erase();
            firmware_file = require("Storage").open("firmware","a");
            firmware_buffer = "";
            reading_firmware = true;
            if(debug) print("firmware read");
        }
        if(data.charCodeAt(0) == 5){
            load(); //we are done
        }
        if(data.charCodeAt(0) == 7){ //a sync is going to start


            var dv = new DataView(E.toArrayBuffer(data.slice(-4)));
            var timestamp = dv.getInt32(0,false);
            E.setTimeZone(0); //set to utc before setting a utc time
            setTime(timestamp);
            E.setTimeZone(timezone); //now set to timezone


            //send back the from_time
            timestamp = parseInt(from_time);
            var message = new ArrayBuffer(20); // an Int32 takes 4 bytes and Int16 takes 2 bytes
            view = new DataView(message);
            view.setUint32(1, timestamp, false); // byteOffset = 0; litteEndian = false
            view.setUint32(5, app_version, false);
            for(var i=0;i<app_name.length;i++){
                message[9+i] = app_name.charCodeAt(i);
            }
            
            message[9+app_name.length] =0;
            if(Bangle.isHRMOn() || menu_active){
                message[0] = 8;
            }
            else{
                message[0] = 7;
            }
            
            Bluetooth.write(message);
            if(debug) print("time sent");

        }

    }
    

  });
  setupServer();
  draw();
  }
  