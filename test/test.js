let nightModeBtn = document.querySelector(".toggleNightMode");
let testSlider = document.querySelector("#test");

var sliderOpts = {
    nightBright: 20,
    bright: 36,
};


testSlider.on("drag",function( percent ){
    let isNightMode = testSlider.getAttribute("nightmode") === "true" ? true:false;
    if( !isNightMode ){
        sliderOpts.bright = percent;
    }else{
        sliderOpts.nightBright = percent;
    }
    console.log("Percent: ", percent);
});

nightModeBtn.addEventListener("click",function(){
    let isNightMode = testSlider.getAttribute("nightmode") === "true" ? true:false;
    if( isNightMode ){
        testSlider.setNightMode(false);
        testSlider.setBrightness(sliderOpts.bright);
        nightModeBtn.innerHTML = "Nightmode is off";
    }else{
        testSlider.setNightMode(true);
        testSlider.setBrightness(sliderOpts.nightBright);
        nightModeBtn.innerHTML = "Nightmode is on";
    }
},false);

if( testSlider.getAttribute("nightmode") === "true" ? true:false ){
    nightModeBtn.innerHTML = "Nightmode is on";
}else{
    nightModeBtn.innerHTML = "Nightmode is off";
}
