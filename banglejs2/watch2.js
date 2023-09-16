NRF.disconnect(); //disconnect at the start.  This removes issues associated with terminals
Graphics.prototype.setFontAnton = function(scale) {
    g.setFontCustom(atob("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/gAAAAAAAAAAf/gAAAAAAAAAAf/gAAAAAAAAAAf/gAAAAAAAAAAf/gAAAAAAAAAAf/gAAAAAAAAAAf/gAAAAAAAAAAf/gAAAAAAAAAAf/gAAAAAAAAAAf/gAAAAAAAAAAf/gAAAAAAAAAAf/gAAAAAAAAAAf/gAAAAAAAAAAf/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAA/gAAAAAAAAAAP/gAAAAAAAAAH//gAAAAAAAAB///gAAAAAAAAf///gAAAAAAAP////gAAAAAAD/////gAAAAAA//////gAAAAAP//////gAAAAH///////gAAAB////////gAAAf////////gAAP/////////gAD//////////AA//////////gAA/////////4AAA////////+AAAA////////gAAAA///////wAAAAA//////8AAAAAA//////AAAAAAA/////gAAAAAAA////4AAAAAAAA///+AAAAAAAAA///gAAAAAAAAA//wAAAAAAAAAA/8AAAAAAAAAAA/AAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////AAAAAB///////8AAAAH////////AAAAf////////wAAA/////////4AAB/////////8AAD/////////+AAH//////////AAP//////////gAP//////////gAP//////////gAf//////////wAf//////////wAf//////////wAf//////////wA//8AAAAAB//4A//wAAAAAAf/4A//gAAAAAAP/4A//gAAAAAAP/4A//gAAAAAAP/4A//wAAAAAAf/4A///////////4Af//////////wAf//////////wAf//////////wAf//////////wAP//////////gAP//////////gAH//////////AAH//////////AAD/////////+AAB/////////8AAA/////////4AAAP////////gAAAD///////+AAAAAf//////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/gAAAAAAAAAAP/gAAAAAAAAAAf/gAAAAAAAAAAf/gAAAAAAAAAAf/AAAAAAAAAAA//AAAAAAAAAAA/+AAAAAAAAAAB/8AAAAAAAAAAD//////////gAH//////////gAP//////////gA///////////gA///////////gA///////////gA///////////gA///////////gA///////////gA///////////gA///////////gA///////////gA///////////gA///////////gA///////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/4AAAAB/gAAD//4AAAAf/gAAP//4AAAB//gAA///4AAAH//gAB///4AAAf//gAD///4AAA///gAH///4AAD///gAP///4AAH///gAP///4AAP///gAf///4AAf///gAf///4AB////gAf///4AD////gA////4AH////gA////4Af////gA////4A/////gA//wAAB/////gA//gAAH/////gA//gAAP/////gA//gAA///8//gA//gAD///w//gA//wA////g//gA////////A//gA///////8A//gA///////4A//gAf//////wA//gAf//////gA//gAf/////+AA//gAP/////8AA//gAP/////4AA//gAH/////gAA//gAD/////AAA//gAB////8AAA//gAA////wAAA//gAAP///AAAA//gAAD//8AAAA//gAAAP+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/+AAAAAD/wAAB//8AAAAP/wAAB///AAAA//wAAB///wAAB//wAAB///4AAD//wAAB///8AAH//wAAB///+AAP//wAAB///+AAP//wAAB////AAf//wAAB////AAf//wAAB////gAf//wAAB////gA///wAAB////gA///wAAB////gA///w//AAf//wA//4A//AAA//wA//gA//AAAf/wA//gB//gAAf/wA//gB//gAAf/wA//gD//wAA//wA//wH//8AB//wA///////////gA///////////gA///////////gA///////////gAf//////////AAf//////////AAP//////////AAP/////////+AAH/////////8AAH///+/////4AAD///+f////wAAA///8P////gAAAf//4H///+AAAAH//gB///wAAAAAP4AAH/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/wAAAAAAAAAA//wAAAAAAAAAP//wAAAAAAAAB///wAAAAAAAAf///wAAAAAAAH////wAAAAAAA/////wAAAAAAP/////wAAAAAB//////wAAAAAf//////wAAAAH///////wAAAA////////wAAAP////////wAAA///////H/wAAA//////wH/wAAA/////8AH/wAAA/////AAH/wAAA////gAAH/wAAA///4AAAH/wAAA//+AAAAH/wAAA///////////gA///////////gA///////////gA///////////gA///////////gA///////////gA///////////gA///////////gA///////////gA///////////gA///////////gA///////////gA///////////gA///////////gAAAAAAAAH/4AAAAAAAAAAH/wAAAAAAAAAAH/wAAAAAAAAAAH/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//8AAA/////+B///AAA/////+B///wAA/////+B///4AA/////+B///8AA/////+B///8AA/////+B///+AA/////+B////AA/////+B////AA/////+B////AA/////+B////gA/////+B////gA/////+B////gA/////+A////gA//gP/gAAB//wA//gf/AAAA//wA//gf/AAAAf/wA//g//AAAAf/wA//g//AAAA//wA//g//gAAA//wA//g//+AAP//wA//g////////gA//g////////gA//g////////gA//g////////gA//g////////AA//gf///////AA//gf//////+AA//gP//////+AA//gH//////8AA//gD//////4AA//gB//////wAA//gA//////AAAAAAAH////8AAAAAAAA////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////gAAAAB///////+AAAAH////////gAAAf////////4AAB/////////8AAD/////////+AAH//////////AAH//////////gAP//////////gAP//////////gAf//////////wAf//////////wAf//////////wAf//////////wAf//////////4A//wAD/4AAf/4A//gAH/wAAP/4A//gAH/wAAP/4A//gAP/wAAP/4A//gAP/4AAf/4A//wAP/+AD//4A///wP//////4Af//4P//////wAf//4P//////wAf//4P//////wAf//4P//////wAP//4P//////gAP//4H//////gAH//4H//////AAH//4D/////+AAD//4D/////8AAB//4B/////4AAA//4A/////wAAAP/4AP////AAAAB/4AD///4AAAAAAAAAH/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//AAAAAAAAAAA//gAAAAAAAAAA//gAAAAAAAAAA//gAAAAAAADgA//gAAAAAAP/gA//gAAAAAH//gA//gAAAAB///gA//gAAAAP///gA//gAAAD////gA//gAAAf////gA//gAAB/////gA//gAAP/////gA//gAB//////gA//gAH//////gA//gA///////gA//gD///////gA//gf///////gA//h////////gA//n////////gA//////////gAA/////////AAAA////////wAAAA///////4AAAAA///////AAAAAA//////4AAAAAA//////AAAAAAA/////4AAAAAAA/////AAAAAAAA////8AAAAAAAA////gAAAAAAAA///+AAAAAAAAA///4AAAAAAAAA///AAAAAAAAAA//4AAAAAAAAAA/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//gB///wAAAAP//4H///+AAAA///8P////gAAB///+f////4AAD///+/////8AAH/////////+AAH//////////AAP//////////gAP//////////gAf//////////gAf//////////wAf//////////wAf//////////wA///////////wA//4D//wAB//4A//wB//gAA//4A//gA//gAAf/4A//gA//AAAf/4A//gA//gAAf/4A//wB//gAA//4A///P//8AH//4Af//////////wAf//////////wAf//////////wAf//////////wAf//////////gAP//////////gAP//////////AAH//////////AAD/////////+AAD///+/////8AAB///8f////wAAAf//4P////AAAAH//wD///8AAAAA/+AAf//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//gAAAAAAAAB///+AA/+AAAAP////gA//wAAAf////wA//4AAB/////4A//8AAD/////8A//+AAD/////+A///AAH/////+A///AAP//////A///gAP//////A///gAf//////A///wAf//////A///wAf//////A///wAf//////A///wA///////AB//4A//4AD//AAP/4A//gAB//AAP/4A//gAA//AAP/4A//gAA/+AAP/4A//gAB/8AAP/4A//wAB/8AAf/4Af//////////wAf//////////wAf//////////wAf//////////wAf//////////wAP//////////gAP//////////gAH//////////AAH/////////+AAD/////////8AAB/////////4AAAf////////wAAAP////////AAAAB///////4AAAAAD/////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/AAB/8AAAAAA//AAD/8AAAAAA//AAD/8AAAAAA//AAD/8AAAAAA//AAD/8AAAAAA//AAD/8AAAAAA//AAD/8AAAAAA//AAD/8AAAAAA//AAD/8AAAAAA//AAD/8AAAAAA//AAD/8AAAAAA//AAD/8AAAAAA//AAD/8AAAAAA//AAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="), 46, atob("EiAnGicnJycnJycnEw=="), 78 + (scale << 8) + (1 << 16));
  };
  
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
  let app_version = 49;
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
  let num_bones = 0;
  // Dog animation
  let dog_happy_till = 0;
  let make_dog_happy = function(for_time){
    dog_happy_till = Date.now() + for_time;  //5 seconds
        drawDog();
  }
  Bangle.on("lock", function(on){
    if(!on){
        make_dog_happy(10000);
    }
  });
  
  var imgs = {
    dog_idle: require("heatshrink").decompress(atob("iMUwkBBpNEAAdAA4MEogBDCBdAAwQQBgMQCAsRiIdBCoIIBgMRCAQaDCAYxCCAohFKIoQBiMM5gACA4QZC8gYDFQYABPIIHFGRYQHOwxtCgiHCPYJLGJgIA=")),
    dog_wag1: require("heatshrink").decompress(atob("i0UwkBBY8BiMRgEEogADBQwBDCqFABAICBBQcRCooJDBQVAgAKIGoQKTFY5sIAQMQ5gAC4ASCoAKBDoPkIgIGCCoQqDJ4JpBGw5aBFoQKFgkAJhEECgUQEAwUCGoMEV4Q0DBQLQGBQQ=")),
    dog_wag2: require("heatshrink").decompress(atob("icUwkBBY8BiEAogADoEAiMAglEAIYSNoAHCCQURiASFiIABEIIYBBIIRBCQYdDCQg3CCQwlGLo4JBhnMAARTCDgfkDYUEE4IsCAAIdBBYQvEBAQ4GoAbGJwIIBQgx6DgiXCRIJUHRoQ=")),
    dog_bowl_empty: require("heatshrink").decompress(atob("kcjwkCkQA/AH4A/AAjOEZZQMB5gADCRIPB4MRAAUcCQIPFkEMB4gSD4AkFgfMCA0R5nAEQs0IAIzF5lEEQsM4lMKwnMA4IiGngaBCQfEogDBEQkgIoItCAAQlDCIgQDAA40EGYQAJESwQKEQgQMCIkMCBY0DEUcAABbSFAH4AkkA")),
    dog_bone: require("heatshrink").decompress(atob("kcjwkBiIA/AH4AxgAGMAAUP+DOEgPwCJP/AAgQKEQoGBIrIA/AH4A/AH4A/ADMQA"))
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
  Bangle.setOptions({"powerSave": true, "hrmPollInterval": 20, "lockTimeout": 10000, "backlightTimeout":10000,"wakeOnBTN1":true,"wakeOnBTN2":true,"wakeOnBTN3":true,"wakeOnFaceUp":false,"wakeOnTouch":false,"wakeOnTwist":false});
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
                  }
                },
    "Exit": function(){
      closeMenu();
    }

  };

  setWatch(function(e){
    if(!menu_active){
      openMenu();
    }else{
      closeMenu();
    }
  }, BTN1, {repeat:true});


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
      view.setUint8(8,0,false); //padding
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

  let accel_log_buffer = new ArrayBuffer(18);
  let accumulated_movement = 0;
  let last_diff = 0;
  let accumulated_jitter = 0;
  let num_samples = 0;
  let last_sample_time = 0;
  Bangle.on("accel", function(data){
    if(syncing){
        return; //for now (should do something like heart rate eventually)
    }
    var time = Math.floor(Date.now() / 1000);
    num_samples++;
    accumulated_jitter += Math.abs(data.diff - last_diff);
    last_diff = data.diff;
    accumulated_movement += last_diff;

    if(time - last_sample_time > 60){
        last_sample_time = time;
        var view = new DataView(accel_log_buffer);
        var time_s = Math.floor(time);
        view.setUint32(0,time_s);
        view.setUint32(4,Math.floor(accumulated_movement*1000)); 
        view.setUint32(8,num_samples); 
        view.setUint32(12,Math.floor(accumulated_jitter*1000)); 
        //+2 so we fall on the 3 boundary
        current_acceleration_file.write(btoa(accel_log_buffer));
        accumulated_movement = 0;
        accumulated_jitter = 0;
        num_samples = 0;
    }
  });
  
  var hrm_log_buffer = new ArrayBuffer(6);
  Bangle.on("HRM", function(hrm) { 
        
        var view = new DataView(hrm_log_buffer);
        var time = Math.floor(Date.now() / 1000);
        view.setUint32(0,time);
        view.setUint8(4,hrm.bpm); //0 - 100
        view.setUint8(5,hrm.confidence); // 0-100
        last_bpm = hrm.bpm;
        last_conf = hrm.confidence;
        if(current_hrm_file != null){
            current_hrm_file.write(btoa(hrm_log_buffer));
        }
        drawWidgets();
  });

  let last_time = 0;
  var hrm_raw_log_buffer = new ArrayBuffer(3);  //might be able to go down to 3 or even 2
  Bangle.on("HRM-raw", function(hrm) { 
        var time = Date.now()/1000;
        if((time-last_hrm_reading_time) > 60*3){
            stopHRMonitor();
            drawWidgets();
            return;
        }
        // var time_delta =  (time-last_time)%256; 
        // last_time = time;
        var view = new DataView(hrm_raw_log_buffer);
        var acc = Bangle.getAccel().diff*200;
        if(acc > 255){
            acc = 255; //we don't want to write 255, because that's a special encoded value
        }

        var time_ms = Date.now();
        var time_delta = time_ms - last_time;
        if(time_delta > 255){
            time_delta = 0; //how often is this happening?
        }
        last_time = time_ms;
        
        view.setUint16(0,hrm.raw);
        view.setUint8(2, time_delta); 
        //view.setUint8(2, acc); 
        if(current_hrmraw_file != null){
            current_hrmraw_file.write(btoa(hrm_raw_log_buffer)); //add to the buffer
        }
  });

  let startHRMonitor = function(){
    if(syncing){ //we don't want the HR monitor to start if we are actively syncing
        return;
    }
    //generate a new filename
    
    tms = Math.floor(Date.now()); //time in milliseconds
    var hrmraw_filename = "hrmraw"+version+"_"+ tms;
    var hrm_filename = "hrmreg"+version+"_"+ tms;
    current_hrm_file = require("Storage").open(hrm_filename,"a");
    current_hrmraw_file = require("Storage").open(hrmraw_filename,"a");
    //we write these names to storage, because we have to remember to sync them
    require("Storage").open(hrm_files_filename,"a").write(hrm_filename+"\n");
    require("Storage").open(hrm_files_filename,"a").write(hrmraw_filename+"\n");

    Bangle.setHRMPower(true,"myapp");
    last_hrm_reading_time = Math.floor(Date.now()/1000); //time in seconds
    require("Storage").write("last_hrm_time",""+last_hrm_reading_time);
    last_bpm = -1;
    last_conf = -1;
    drawWidgets();

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
        g.setFontAlign(1, 0).setFont("6x8",2).drawString(""+E.getBattery(), 170, 10);
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
        
      g.clearRect(bone_area_rect[0],bone_area_rect[1],bone_area_rect[2],bone_area_rect[3])
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
            g.clearRect(x,y,x+w,y+h/2);
            g.drawImage(imgs.dog_bowl_empty,x,y,{scale:scale} );
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
        let frames = [imgs.dog_wag1,imgs.dog_wag2];
        let img;
        if(dog_happy_till > Date.now()){
            if(drawDogTimeout != undefined){
                clearTimeout(drawDogTimeout);
            }
            drawDogTimeout = setTimeout(drawDog,400);
            currentframe = (currentframe + 1)% frames.length;
            img = frames[currentframe];
        }else{
            img = imgs.dog_idle;
        }

        metrics = g.imageMetrics(img);
        dog_scale = 4;
        dog_w = metrics.width*dog_scale;
        dog_h = metrics.height*dog_scale;
        dog_x = 10;
        dog_y = 30;
        if(!menu_active){
          if(last_dog_rect.length > 0){
            g.clearRect(last_dog_rect[0],last_dog_rect[1]-10,last_dog_rect[2],last_dog_rect[3]);
          }
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
  let draw = function() {
    if(syncing) return;
    
    if(!menu_active){
      drawClockFace();
      drawWidgets();
    }
   
    writeMovementLog();
    
    let dt = new Date();
    let date_string = dt.getFullYear() + "/" + (dt.getMonth() + 1) + "/" + dt.getDate();
    if(date_string != current_day){
      //it's a brand new day
      current_goal = writeSetting("current_goal",next_goal);
      daily_steps = writeSetting("daily_steps", 0);
      goals_reached = writeSetting("goals_reached", 0);
      current_day = writeSetting("current_day",date_string);
      bones_eaten = writeSetting("bones_eaten", 0);
    }
    /* we are not doing this for now.  Uses too much battery life.
    var time = Math.floor(Date.now() / 1000);
    if(time - last_hrm_reading_time > 60*20){
        startHRMonitor();
    }
    */

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
  