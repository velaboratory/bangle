
Bangle.setLCDPower(1); // keep screen on
g.clear();



var breed_imgs = {
// now using optimal 4 bit unless otherwise said in comments
  
//husky images
  
  husky_static: require("heatshrink").decompress(atob("kcj4kA///A4IDBlFC221Jv4A/ACcBiIAHCI8TmMzAAYFBiAiHmcTCIgYBETYMBkYCBERJPBmciAAISBiIiHGoUikMRCIIPJGoIgBkICCRpUSGYQABERoACERasFERQ0FCBcBolERgTlLikzmUiogiLiAgBNB1CB4TRBERSuBCQJIBERURIYIABkEhCJJnBiUSmkQiQ0KTgqdMAH4A/AAoA==")),

  husky_tail_one:
require("heatshrink").decompress(atob("kcj4kA///A4IDBlFC221Jv4A/ACcBiIAHCI8TmMzAAYFBiAiHmcTCIgYBETYMBkYCBERJPBmciAAISBiIiHGoUikMRCIIPJGoIgBkICCRpUSGYQABERoACERasFERQ0FiASKgNEoiMCgKLIAAMUmcykVEiETERMQEAI0CiIiJgNCB4TRBGZSuBCQJIBGZURIYIABkEhM5cSiU0iESGZScFTpgA/AH4AF")),
  
  husky_tail_final:
require("heatshrink").decompress(atob("kcj4kA///A4IDBlFC221Jv4A/ACcBiIAHCI8TmMzAAYFBiAiHmcTCIgYBETYMBkYCBERJPBmciAAISBiIiHGoUikMRCIIPJGoIgBkICCRpUSGYQABERoACERasFEQIkJGggOBNJMBolERgQGBoIiIikzmUiokQgMSEREQEAI0CiM0GZNCB4TRBV4KuKCQJIBiZnJiJDBAAMgkIQJM4MSiRBBiTzITg7zKAH4A/AA4A==")),
  
  husky_sleeping:
require("heatshrink").decompress(atob("kcj4kA///A4IDB221lFCJv4A/AH4AZiIAICA0BoNEAAUUiUkkUQCI0UigQCoNBCAMhER0iERERikREIIQBmUkmJXHgNEoUSCQMimQiIgAuCAAJnCERJ2EiczmIiIidBNgMxRZQiCiACCcf4A/AH4A8A=")), 
  
//chocolate lab images
  
  chocolate_lab_staic: require("heatshrink").decompress(atob("kcj4kA///4+aI/4A/ADMCkQAHCI8hiURAAYFBkAiHiMhCIgYBETYSCAQIiJJ4IiFkQiHGoQNCCIIPJGoQyCAQKNKNAoiNIoYiKVgoiKGgoQLGggzLESJoiESDRGCJL1CEgICBGhScFTpgA/AH4AF")),
  
  chocolate_lab_tail_one:
require("heatshrink").decompress(atob("kcj4kA///4+aI/4A/ADMCkQAHCI8hiURAAYFBkAiHiMhCIgYBETYSCAQIiJJ4IiFkQiHGoQNCCIIPJGoQyCAQKNKNAoiNIoYiKVgoiKGgsgCRQ0EiUCGpQiFkKLLAAciERJoGGZ7RBGZLRGM5chEgICBGZScFTpgA/AH4AFA")),
  
  chocolate_lab_tail_final:
require("heatshrink").decompress(atob("kcj4kA///4+aI/4A/ADMCkQAHCI8hiURAAYFBkAiHiMhCIgYBETYSCAQIiJJ4IiFkQiHGoQNCCIIPJGoQyCAQKNKNAoiNIoYiKVgoiBK5YzENJI0EGYMCGxIiFgUhERBoFRwIzNGgKhBRZwyJMAIiFCBL1CEgICBTpScFeZQA/AH4AHA")),
  
 chocolate_lab_sleeping:
require("heatshrink").decompress(atob("kcj4kA///A4PHzXimEjoOkrOhkGGxVGvVhiHltMFuVAiEluUCnPClBj/AH4A/AAcRABAQGgO2uUiAANK+8ilEQCI0bs4QCkmvCwOBEQ9ZvGCkWIovnERMBi/klGDnc4EwIiHCINyk9SkUjotV1AiHgEXIoUimMRjIiJ8lEAANJitVqYiIiuhgFq18R+czRY4iBt8Qhn/yDj/AH4A/AHg")), 
  
  
//German Shepard
  
  gshep_static: require("heatshrink").decompress(atob("kcj4kA///A4Or1YFBlFCJv4A/ACcBiIAHCI8SmMiAAchkcQEQ8yiUiAIcTkIiHiYiGmYiJDgIPBoMjERJPBmQQBklEoMREQ41CmUxiNEogPJGoMzmlBCANBRpUTBwIACERYQEERasFERQ0BmYABmAQLgMiCAMyRJAiEkUjmTPIAAcUoaeBPoJoMCIMzNBkUoUjmcjRZcRoZoCmdBCJMBkcSPYICBNJScFTpgA/AH4AFA")),
  
  gshep_tail_one: require("heatshrink").decompress(atob("kcj4kA///A4Or1YFBlFCJv4A/ACcBiIAHCI8SmMiAAchkcQEQ8yiUiAIcTkIiHiYiGmYiJDgIPBoMjERJPBmQQBklEoMREQ41CmUxiNEogPJGoMzmlBCANBRpUTBwIACERYQEERasFERQ0BmYABmEQCRUBkQQBmUhgI1KicikcyZ4MUERMUoaeBPoMRERJoBCIMzNAIzKilCkczkdEiYzJiNDNAUzoJnKkcSPYICBeZCcHTpgA/AH4AF")),
  
  gshep_tail_final:
require("heatshrink").decompress(atob("kcj4kA///A4Or1YFBlFCJv4A/ACcBiIAHCI8SmMiAAchkcQEQ8yiUiAIcTkIiHiYiGmYiJDgIPBoMjERJPBmQQBklEoMREQ41CmUxiNEogPJGoMzmlBCANBRpUTBwIACERYQEERasFEQJXKmYABmAOBNJMBkQQBmSJBgI2JicikcyZ4MBiYiIilDTwJ9BiNDGZNECIMzNAKvBGZEUoUjmcjogyJMANDNAUzoIQJgMjiR7BAQLzITg7zKAH4A/AA4")),
  
  gshep_sleeping:
require("heatshrink").decompress(atob("kcj4kA///A4Or1YFBlFCJv4A/AH4AZiIAICA0BmMiAAUTikymcQCI0SiQQCkMhmUjmIiHkIiDiUTmYiIiMSiMioMUicjmkhK48BEAMUolBmcjEREAFwNEAAJnCoIiIOwkUmcxEREUHwMSoKLKEQUQAQTj/AH4A/AHgA=")), 
  
  //pinscher 
  //MUST BE IN OPTIMAL 3 BIT WHEN CONVERTED
  
 pinscher_static:
require("heatshrink").decompress(atob("kcj4cA///A4PDjHHzVGvWkrNmwWCiBT/AD0JkmSpICBpAMFn+f6v/6v5/mABgkUxQYD0lABgkKos3iVR2lSkAMEgsi+Vt22zlKaFgVJpu27dtiRBGgGm88+m2ILg9Wt0o71EBg8po3buMiBg8f6u2NAKDMOgoAC+tt2tyTxFS1u6yIMIlNW7tIExGkyt1khoIqSqCNBJOCNBH0LQWXWwoABs/00mN/y2FAAL4LAH4AmA")),
  
  
  pinscher_tail_one:
require("heatshrink").decompress(atob("kcj4cA///A4PDjHHzVGvWkrNmwUFuRT/AD0JkmSpICBpAMFlMUytJqmRpGABgkUxQYD0lABgkKos36Vd2lSkAMEgsi+Vt22zlMQBgkCpNN23btsSII0A035k+2xBcHq1v13eogMHlNG7dxkQMHNAO26mRQZh0FAAWltu1kUJBg9S9u+yMFNApBCq3dpGCLg+kyt1kmJLg9SVQVFExBOCkQmHyhaCyK2FAANiqmkxtKEw74LAH4Am")),
  
  
  pinscher_tail_final:
require("heatshrink").decompress(atob("kcj4cA///A4PDjHHzVGvWkrNmwUFuRT/AD0JkmSpICBpAMFlMUytJqmRpGABgkUxQYD0lABgkKos36Vd2lSkAMEgsi+Vt22zlMQBgkCpNN23btsSII0A035k+2xBcHq1v13eogMHlNG7dxkQMHNAO26mRQZmAhANG0tt2omBkgMGqXt3wmBiSDFIINW7qbBpSDFgGkyt1kmJVQwmBVQVFExBOCkSDHyhaCyIyGgFiqmkxtKWwoABfBYA/AEw")),
  
  
  pinscher_sleeping:
require("heatshrink").decompress(atob("kcj4cA///A4PDjHHzRL/AH4AakmSpICDyAMEilSBIOKlMkxAMEhQIByVFimSogMEgsU7dN2WKpMiBgkCpUl21KDoORIIsFk3LtImBpGADQuTtu0xMkylABgkBLIekyMgE4umoEtiRoHgFJkESpC6/AH4A9A=")), 
  
  
  //blonde beagle 
  //MUST BE IN 3 BIT RGB WHEN CONVERTED
  
  bb_static:
require("heatshrink").decompress(atob("kcjwcBkmSpIC/ATdANAhlGjcN23btuw7ESDQmN4/4v/G/l8hIaEo3j9////un0EEwkjsPw//+m8bgQmEyEA/YZB/eAU49/+EDv/BLg8//8N//gNY8fEwP/+B3HxpoDQZh0FAQVtDQNgTxBBB//4VpBBC/gmJBgP9wIaHmwMB/3AEw8b//2/8AEw8BOoXAWwomCjFtwy2GAQL4LAX4ClkAA==")),
  
  bb_tail_one: require("heatshrink").decompress(atob("kcjwcBkmSpIC/ATdANAhlGjcN23btuw7ESDQmN4/4v/G/l8hIaEo3j9////un0EEwkjsPw//+m8bgQmEyEA/YZB/eAU49/+EDv/BLg8//8N//gNY8fEwP/+B3HxpoDQZh0FAQVtDQNgoBBJ//4kBoFIIn8iOBEw4MB/uA4AmGmwMB/3DEw8b//2/8BEw8BOoXAWwomCjFtwy2GAQL4LAX4ClkAA=")), 
  
  bb_tail_final:
require("heatshrink").decompress(atob("kcjwcBkmSpIC/ATdANAhlGjcN23btuw7ESDQmN4/4v/G/l8hIaEo3j9////un0EEwkjsPw//+m8bgQmEyEA/YZB/eAU49/+EDv/BLg8//8N//gNY8fEwP/+B3HxpoDQZkSoIOGtoaBsFJgBBI//4kmAQYpBD/kSgyDFEwIMB/uA/CqFyU2BgP+4cAEw0b//2/8BwJNGgJ1C4AyGEwMYtuGWwwCBfBYC/AUsg")),  
  
  bb_sleeping:
require("heatshrink").decompress(atob("kcjwcBkmSpIC/AX4CPTo0CBwmOn////Hjf/4IaEo8fBgPjx/28AmEkcN2//sOH/fwEwmQg0D/0Gj9/+BBFkdt4/bh/3/kSDQmRGYP/4EAhkJDQlILIdt2EENYt+hMfwBoHyUAgmAgK8/AX4C8kA=")), 
  
  
  //beagle
  // MUST BE IN 4 BIT MAC PALETTE WHEN CONVERTED
  
  b_static:
require("heatshrink").decompress(atob("kcjwkGswA/AHqKHQ5EFqFVAAYFBCI9gokEolUAIUEoAiHBINEAAYFBERVAl//kAiKKANEo32/8koBXJGoMvmEAmwyIGoYyBmM2+0gRhUP/4ADERciAAYiLVpwACgIhCkIQLsBED+DkLgQQC+QiLgFPCIVANBadBCAMkgAiO+wiLgEWGYX2iARJsEzg0DAQUwTh6dMAH4A/VIoA==")),  
  
  b_tail_one:
require("heatshrink").decompress(atob("kcjwkGswA/AHqKHQ5EFqFVAAYFBCI9gokEolUAIUEoAiHBINEAAYFBERVAl//kAiKKANEo32/8koBXJGoMvmEAmwyIGoYyBmM2+0gRhUP/4ADERciAAYiLVpwACgIhCkMGgA0KIgfwsFQCJMCCAXyg0EGpMAp4RCTgKuIGYKdBCAMkCBQiE+1Ah4zKiwzC+0QCBNgmcGgYCCmCcPTpgA/AH6pFA=")),  
  
  b_tail_final:
require("heatshrink").decompress(atob("kcjwkGswA/AHqKHQ5EFqFVAAYFBCI9gokEolUAIUEoAiHBINEAAYFBERVAl//kAiKKANEo3//8koBXJGoMvmEAn4yIGoYyBmM/+0gRhUPGQIACERciAAYiLVo4kJgIhCkIOBgA0JIgfwAwNQCJECCAXyg1giQ0IgFPCIScBocWGZCdBVwUACQJoJEQX2oEPM5MAiwzC+0QCBNgmcGgYCCmCcPeZQA/AH6pHA")),
  
  b_sleeping:
require("heatshrink").decompress(atob("kcjwkBiIA/AH4A/AATRJCA0QoFEAAUEggDBb44LDolAoH0onwERQNBgkP+n/EQ8AgkA//wCAP/AgJXHiALBBwPwAgIiIiIdCAAJnCERJ2ELgPwERIbBAQKLKEQUBAQTj/AH4A/AHcQA=")), 
  
 // blue heeler 
  
  bh_static: require("heatshrink").decompress(atob("kcj4kA///A4NP8vDjGLxcooXO4koweCiGu3mLpXlsNM2mO3miiFKpRj/AH0RAA0QCA8YwOIAAYFBCI8BmcTmezAIUTmIiHBIMzmdaqczAoIiKm861U3ERRQBEIOq1VTmJXJGoO2qMRq2zB5I1B2UmqdWkWxRhUSkUtpsikQiLu4ADuKvQERUAi4iDCBcBoRDBkVBchcfCIVPERcVr4RBp9VNBdVCIIQBqIiLqoADERUYqv1B4P1rARJgPFmnlqvkmvBTh6dMAH4A/AAo")),
  
  bh_tail_one:
require("heatshrink").decompress(atob("kcj4kA///A4NP8vDjGLxcooXO4koweCiGu3mLpVM2mO3miiHHnPlsJj/AH0RAA0QCA8YwOIAAYFBCI8BmcTn3zmf+AoMxEQ4JBmcz9XjmYFBERU39Wq84iKKAIhB1Wq8cxK5I1B+1RiNW+YPJGoPyk1Tq0i+KMKiUillMkUiERd3AAdxV6AiKgEXEQcQiI0KoRDBkVBgKLIAAMVCIVFiEeGpMeqoRBoteiPhGZNVCINFqtRCBIzBCIIACiozJjFV0oPB0tYCBMB30073u6k+2KcPTpgA/AH4AFA=")),
  
  
  bh_tail_final:
require("heatshrink").decompress(atob("kcj4kA///A4NP8vDjGLxcooXO4koweCiGu3mLpVM2mO3miiHlsPHnJj/AH0RAA0QCA8YwOIAAYFBCI8BmcTn/jmfvAoMxEQ4JBmcz/XzmYFBERU3/Wq+4iKKAIhB1Wq+cxK5I1B81RiNW8YPJGoPik1Tq0i8KMKiUillMkUiERd3AAdxV6AiBEhMXEQYOBiI0JoRDBkVBgEIRhEAioRCosQgPfGhEfqoRBotfiP/wAzIqoRBotVqPxIpMVCIIACipnJjFV0oPB0tYCBMB3807//6k/2KcPeZQA/AH4AH")),
  
  
  bh_sleeping:
require("heatshrink").decompress(atob("kcj4kA///A4PDjFP8vu5mLpUmrXN5mKzcJoUt1mCiHLzdBhHFpNLvZj/AH4A/AAcRABAQGgO9kQAC7fZqtZiARGjfSCAUt3uVquREQ+xlcuyW77clERMBiXurNe8QzBERARBsc/9Uz4UpzOZEQ8Aikzp8zmfhiMdERNms3ms1iiWZ8QiIjGBgEox0RNgKLHEQMuiEL92wcf4A/AH4A8A")), 
  
  
  
  //Dalmatian
  //MUST USE 3 BIT RGB WHEN CONVERTING 
  
  d_static:
require("heatshrink").decompress(atob("kcjwcBkmSpIC/ATdANAhlGgEP//nx/4gESDQmAg/8v/H/kAhImFgf/AAP+gEEEwkggP4BYM/gECEwmQgAZC/+AU49/8ECv/BLg8//0J//gNY8fEwXwO4+OnAMB/CDMOgoCCQYImJyRcB/04VpEAvySBExF/EwOPNBE4/l+gBoIgC2BR4ImHgJ1C4C2FR4UQv/Ej+CEw74KAX4ClkAA==")),
  
  d_tail_one:
require("heatshrink").decompress(atob("kcjwcBkmSpIC/ATdANAhlGgEP//nx/4gESDQmAg/8v/H/kAhImFgf/AAP+gEEEwkggP4BYM/gECEwmQgAZC/+AU49/8ECv/BLg8//0J//gNY8fEwXwO4+OnAMB/CDMOgoCCQYImBoAaHLgP+nEjwQaGgF+SQMRLg9/EwOP4BcHnH8v0A8YmIWwP/wImHgJ1C4C2FR4UQv/Ej4mIfBQC/AUsg")), 
  
  d_tail_final:
require("heatshrink").decompress(atob("kcjwcBkmSpIC/ATdANAhlGgEP//nx/4gESDQmAg/8v/H/kAhImFgf/AAP+gEEEwkggP4BYM/gECEwmQgAZC/+AU49/8ECv/BLg8//0J//gNY8fEwXwO4+OnAMB/CDMiVBBwyDBEwUADQxcB/04RIKDFCgN+SQMSg6DFNAImBx/ABwImFnH8v0A8YmIWwP/wKDHgJ1C4AyGR4MQv/Ej+CQYz4LAX4ClkA")), 

  d_sleeping:
require("heatshrink").decompress(atob("kcjwcBkmSpIC/AX4CPTo0CBwmAn////AjkP4IaEoEfBgPgh/HgAmEkEPBgPwg//wAmEyEHgf+g8cv04IIsj//H/+P4/8iQaEyImBIIMAh0JDQlILId//EENYt+hMfwBoHyUAgmAgK8/AX4C8kAA="))
};


    