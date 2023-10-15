g.clear(); 



var imgs = {
  sitting_dog: require("heatshrink").decompress(atob("kcjwkBiIA/AH4AOTY6YIiEAogADoEAERMEogBDETtAB4QiKEYIiFNJRBBGAIRBEJIiDGoYiMM4QiOIpytOAAUM5gACCBY0C8gzMK4YABVpIQGNDoiQegziLggkBAQI0KTgqdMAH4AziA")),

  first_pet:
require("heatshrink").decompress(atob("kcjwkBiIA/AH4AOTY6YIiEAogADoEAERMEogBDETtAB4QiKEYIiFNJRBBGAIRBEJIiDGoYiMM4QiOIpytGiARJhnMAAQQBRhI0C8gzCghHJKgQABGoJHJCAgRBCBJoGoAzORwIQJegziLggkBAQKdKTgqdBV5QA/AGcQ")),
  
  final_dog_hearts:
require("heatshrink").decompress(atob("kcjwkBiIA/AH4AOTY6YIiEAogADoEAERMEogBDETtAB4QiKEYIiFNJRBBGAIRBEJIiDGoYiMM4QiOIpytIEpEM5gACBoMQggRHGgXkGYQGBERBUCAAI1BCBwRBCBJoGoB7JEQpUIPIQiFcRcEEgICBTpScFToYA/AHkQ"))
  
};
  var currentframe = 0;
  
  //g.drawImage(imgs.sitting_dog,30,30,{scale:3});
let drawDogTimeout;
  let drawDog = function(){
  var frames = [imgs.sitting_dog,imgs.first_pet,imgs.final_dog_hearts];
      if(drawDogTimeout != undefined){
                clearTimeout(drawDogTimeout);
            
            drawDogTimeout = setTimeout(drawDog,400);
            currentframe = (currentframe + 1)% frames.length;
            img = frames[currentframe];
        }else{
            img = imgs.dog_idle;
        }
g.drawImage(imgs.sitting_dog,imgs.final_dog_hearts,30,30,{scale:3});

    
  };
Bangle.on('drag', function(event) { 
  drawDog();
          
        }); 
