class hsBrightness extends HTMLElement {
    template = `
    <span class="hs-brightness-lower"></span>
    <span class="hs-brightness-handle" draggable="true">
        <span draggable="false" class="hs-brightness-percent-holder noselect"></span>
    </span>`;

    minHandleHeight = 20;
    handleHeight    = 20;

    maxNightBright  = 20;
    nightBright     = 10;
    brightness      = 50;
    maxBrightness   = 100;

    fullHeight_Pixel    = 250;
    lastEvtVal          = 0;
    currPixel           = 0;

    elements = {
        handle:     null,
        percent:    null,
        body:       null
    };

    userEvents = {
        "drag" : null,
        "stop" : null
    };

    connectedCallback() {
        this.id = this.getAttribute("id");
        if (!this.id || this.id === "") {
            console.error("[HSH-Brightness] - Brightness should have an ID.");
            return;
        }
        this.cssRoot    = document.querySelector(':root');
        this.innerHTML  = this.template;
        this.setFullHeight( this.fullHeight_Pixel );
        this.getOptions();
        this.setHandleHeight( this.handleHeight );
        this.getElements();
        this.handleDragEvent();
        this.setLoadStates();
    }

    on(event,cb){
        if( !this.userEvents.hasOwnProperty(event) ){
            console.error(`[HSH-Brightness] - No such event as ${event}`);
            return;
        }
        this.userEvents[event] = cb;
    }

    getOptions(){
        this.brightness     = parseInt( this.getAttribute("brightness") );
        this.maxNightBright = parseInt( this.getAttribute("maxNightBright") );
        this.nightBright    = parseInt( this.getAttribute("nightBright") );
        this.nightMode      = this.getAttribute("nightmode") == "true" ? "true":"false";
        
    }

    setLoadStates(){
        let bright = this.brightness;
        if( this.nightMode ){
            bright  = this.nightBright;
        }
        this.setNightMode(this.nightMode);
        this.setBrightness(bright);
    }

    setNightMode(state){
        this.nightMode = state;
        this.setAttribute("nightmode",state);
        
        if( this.nightMode === true ){
            this.maxBrightness = this.maxNightBright;
        }else{
            this.maxBrightness = 100;
        }
    }

    setBrightness(brightness){
        this.brightness = brightness;
        this.setAttribute("brightness",brightness);
        if( this.nightMode ){
            this.getNightPixelFromPercent(brightness);
        }else{
            this.getPixelFromPercent(brightness);
        }
        this.setVisualPercent(brightness);
    }

    setFullHeight( height ){
        this.fullHeight_Pixel = height;
        if( this.fullHeight_Pixel > 300 ){
            this.fullHeight_Pixel = 300;
            console.error(`[HSH-Brightness] - Maximum full height is ${300}px!`);
        }
        this.cssRoot.style.setProperty('--hsh-brightness-height',`${this.fullHeight_Pixel}px`)
    }

    setHandleHeight( height ){
        this.handleHeight = height;
        if( this.handleHeight < this.minHandleHeight ){
            this.handleHeight = this.minHandleHeight;
            console.error(`[HSH-Brightness] - Minimum handle height is ${this.minHandleHeight}px!`);
        }
        this.cssRoot.style.setProperty('--hsh-brightness-handle-height', `${this.handleHeight}px`);
    }

    getElements(){
        this.elements.handle    = this.querySelector(".hs-brightness-handle");
        this.elements.percent   = this.querySelector(".hs-brightness-percent-holder");
        this.elements.body      = this.querySelector(".hs-brightness-lower");
    }

    getCorrectHandleHeight(){
        let handleHalfPixel = this.handleHeight / 2;
        return handleHalfPixel / this.fullHeight_Pixel * 100
    }

    getNightPixelFromPercent(brightness){
        this.currPixel =  ( brightness / this.maxNightBright ) * this.fullHeight_Pixel;
    }

    getPixelFromPercent(brightness){
        let height = this.fullHeight_Pixel;
        this.currPixel = (height / 100) * brightness;
    }

    setVisualPercent(percent){
        this.brightness = this.clamp(percent,0,100);
        this.setAttribute("brightness",this.brightness);
        this.elements.percent.innerText     = `${this.brightness}%`;
        this.elements.body.style.height     = `${this.currPixel}px`;
        this.elements.handle.style.bottom   = `${this.currPixel-this.handleHeight/2}px`;

        if( this.currPixel >= this.fullHeight_Pixel -15 ){
            this.classList.add("atFull");
        }else{
            this.classList.remove("atFull");
        }
    }

    
    emit(event,value){
        if( this.userEvents[event] !== null ){
            if( this.lastEvtVal !== value ){
                this.lastEvtVal = value;
                this.userEvents[event](value);
            }
        }
    }

    handleDragEvent(){
        let self = this;
        ['drag', 'touchmove'].forEach(evt =>
            self.elements.handle.addEventListener(evt, function (e) {
                const target = e.target.parentElement;
                const rect = target.getBoundingClientRect();

                let relativeBottom;
                if( e.type == "drag" ){
                    relativeBottom = e.clientY - rect.bottom;
                }else{
                    relativeBottom = e.touches[0].pageY - rect.bottom;
                }

                if( relativeBottom > 0 || relativeBottom < -self.fullHeight_Pixel - 10 ){ return; }

                self.currPixel = Math.abs(relativeBottom);

                let percent = Math.floor( (self.maxBrightness / self.fullHeight_Pixel) * Math.abs(relativeBottom) );
                self.setVisualPercent( percent );
                
                self.emit("drag",self.brightness);
                e.preventDefault();
                return false;
            }, false)
        );

        ['dragstart', 'touchstart', "click"].forEach(evt =>
            self.elements.handle.addEventListener(evt, function (e) {
                let body = self.elements.handle.closest("body");
                if( body ){
                    body.style["overscroll-behavior"] = "contain";
                    body.style["touch-action"] = "none";
                }
                if( e.type == "click" ){ return; }
                self.setAttribute("touching",true);
                e.dataTransfer.setDragImage(document.createElement('span'), 0, 0);
                window.getSelection().removeAllRanges();
                return false;
            }, false)
        );

        ['dragend', 'touchend'].forEach(evt =>
            self.elements.handle.addEventListener(evt, function (e) {
                if( self.userEvents.stop !== null ){
                    self.userEvents.stop(self.percent);
                }
                let body = self.elements.handle.closest("body");
                if( body ){
                    body.style["touch-action"] = "auto";
                }
                self.setAttribute("touching",false);
                return false;
            }, false)
        );
    }

    clamp(val, min = 0, max = 100) {
        return val > max ? max : val < min ? min : val;
    }
};
customElements.define('hs-brightness', hsBrightness);