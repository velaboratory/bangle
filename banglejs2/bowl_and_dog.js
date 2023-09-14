g.clear(); 
var dog_bowl_img_obj = {
  dog_bowl_empty: require("heatshrink").decompress(atob("kcjwkBiIA/AH4AgiCrEVBUA5gAECRMMBYIADAwIRHiHAcI3ACB4RIGYw0JiBVFAAQiI4AcBNAgiHCAP/GYkP+ARGD4IRBAAgQBCIpEBERJGFEQRFHEQ4AJEQqaHcxwA/AH4A/ABMQA==")),

  dog_bone:
require("heatshrink").decompress(atob("kcjwkBiIA/AH4AxgAGMAAUP+DOEgPwCJP/AAgQKEQoGBIrIA/AH4A/AH4A/ADMQA"))
};


  g.drawImage(dog_bowl_img_obj.dog_bowl_empty,30,30,{scale:3});
    g.drawImage(dog_bowl_img_obj.dog_bone,30,5,{scale:2});
