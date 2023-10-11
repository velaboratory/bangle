
var fastUpdateTimePET = 500;
var slowUpdateTimePET = 2000;
var stopTimePET = 10000;
var awakeTimePET = 4000;
var fastDrawIntervalPET;
var slowDrawIntervalPET;
var timeoutPET;
var stopTimeoutPET;
var pet_dog =[require("heatshrink").decompress(atob("kcjwkBiIA/AH4ABjnB5gQO5gABCKA0PCB4RBBA7eHbZEQgFEAAdAgArIgEEogBDETtAB4QiKEYIiFORRBBGAIRBEJIiDGoYiMM4QiOIpytOAAUMdwIABCBY0C8gzMK4YABVpIQGNDoiQegziLggkBAQI0KTgqdMAGEQA")),require("heatshrink").decompress(atob("kcjwkBiIA/AH4A/ACLeHbZEQgFEAAdAgAiJglEAIYidoAPCERQjBEQppKIIIwBCIIhJEQY1DERhnCERxFOVpwAChnMAAQQLGgXkGZhXDAAKtJCAxodESD0GcRcEEgICBGhScFTpgAwiA")),require("heatshrink").decompress(atob("kcjwkBiIA45kc4IQOAAIRQCBwRBCB8RCAJHB5gSNjhJCCKA2OCIJIPjgIHbw7bIiEAogADoEAFZEAglEAIYidoAPCERQjBEQpyKIIIwBCIIhJEQY1DERhnCERxFOVpwAChjuBAAMBPRvkGYMQGpRUCAAKjBERIQECIIiJNA1AER4zKegxnLggkBAQJnKTgqdMAGEQA==")),require("heatshrink").decompress(atob("kcjwkBiIAZjnB5gQO5gABBpPMD4IRDCBQABCIYwKCAYRBIRYQDABoyCM7oRGTh4QPM5LeHbZEQgFEAAdAgArIgEEogBDETtAB4QiKEYIiFORRBBGAIRBEJIiDGoYiMM4QiOIpytOAAUMdwIABCAMQTxIxB8gzCiA2JKgQABGoIQOCIIQJNA1ALBIiFggQJegziLggkBAQKdKTgqdMAGEQA=="))];

var currentframe=0;

 

var draw = function(){
  //draw current frame of dog
  g.clearRect(0,0,200,200);
  g.drawImage(pet_dog[currentframe],10,10,{scale:4} );
  currentframe = (currentframe + 1)% pet_dog.length;
};

//clear the screen once to get started
g.reset();
g.clear();
draw();
//by default start watch in low power
slowDrawIntervalPET = setInterval(draw, slowUpdateTimePET);

Bangle.on('drag', function(event) { 

  //stop low power
  stopEverything();
  //start high power
  fastDrawIntervalPET = setInterval(draw, fastUpdateTimePET);
  //stop high power after some amount of time
  timeout = setTimeout(stopFastDrawPET, awakeTimePET);
  stopTimeoutPET = setTimeout(stopEverything, stopTimePET);
});


var stopFastDrawPET = function() {
  //actually stop high power
  clearInterval(fastDrawIntervalPET);
  //make sure and start low power again!
  slowDrawIntervalPET = setInterval(draw, slowUpdateTimePET);
};

var stopEverything = function() {
  if(timeoutPET) {
    clearTimeout(timeoutPET);
  }
  if(stopTimeoutPET) {
    clearTimeout(stopTimeoutPET);
  }
  if(fastDrawIntervalPET) {
    clearInterval(fastDrawIntervalPET);
  }
  if(slowDrawIntervalPET) {
    clearInterval(slowDrawIntervalPET);
  }
};