class hsBrightness extends HTMLElement {
    template = `
    <span class="hs-brightness-lower"></span>
    <span class="hs-brightness-handle" draggable="true">
        <span draggable="false" class="hs-brightness-percent-holder noselect"></span>
    </span>`;

    percent = 50;

    minHandleHeight = 20;
    handleHeight    = 20;
    
    fullHeight      = 250;
    maxFullHeight   = 300;

    maxPercent      = 100;
    maxNightBright  = 20;
    nightBright     = 15;

    handleEl = null;
    lowerHalfEl = null;

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
        this.cssRoot = document.querySelector(':root');
        this.setHandleHeight( this.handleHeight );
        this.setFullHeight( this.fullHeight );
        this.addTemplate();
        this.getElements();
        this.getAttributes();
        this.addEvents();
    }

    on(event,cb){
        if( !this.userEvents.hasOwnProperty(event) ){
            console.error(`[HSH-Brightness] - No such event as ${event}`);
            return;
        }
        this.userEvents[event] = cb;
    }

    setHandleHeight( height ){
        this.handleHeight = height;
        if( this.handleHeight < this.minHandleHeight ){
            this.handleHeight = this.minHandleHeight;
            console.error(`[HSH-Brightness] - Minimum handle height is ${this.minHandleHeight}px!`);
        }
        this.cssRoot.style.setProperty('--hsh-brightness-handle-height', `${this.handleHeight}px`);
    }

    setFullHeight( height ){
        this.fullHeight = height;
        if( this.fullHeight > this.maxFullHeight ){
            this.fullHeight = this.maxFullHeight;
            console.error(`[HSH-Brightness] - Maximum full height is ${this.maxFullHeight}px!`);
        }
        this.cssRoot.style.setProperty('--hsh-brightness-height',`${this.fullHeight}px`)
    }

    getElements() {
        this.handleEl           = this.querySelector(".hs-brightness-handle");
        this.lowerHalfEl        = this.querySelector(".hs-brightness-lower");
        this.percentHolderEl    = this.querySelector(".hs-brightness-percent-holder");
    }

    getAttributes() {
        this.percent    = parseInt(this.getAttribute("percent"));
        if( isNaN(this.percent) ){ this.percent = 50; }
        let isNightMode = this.getAttribute("nightmode") == "true" ? "true":"false";
        this.maxNightBright = parseInt( this.getAttribute("maxNightBright") );
        this.nightBright    = parseInt( this.getAttribute("nightBright") );

        if( isNightMode ){
            this.percent = this.nightBright;
        }
        this.setNightMode( isNightMode, this.percent );

        this.name       = this.getAttribute("name");
        /*
        setTimeout(() => {
            this.refreshDisplayPercent();
        }, 100);
        */
    }

    setNightMode(state,percent){
        this.nightMode = state;
        if( this.nightMode == true ){
            this.maxPercent = this.maxNightBright;
        }else if( this.nightMode == false ){
            this.maxPercent = 100;
        }
        this.setAttribute("nightmode",this.nightMode);
        this.setPercent(percent);
        
        this.updateDisplayPixel(this.getPosPixel());
        this.refreshDisplayPercent();
    }

    setNightModePercent(percent){
        this.maxNightBright = percent;
    }

    addTemplate() {
        this.innerHTML = this.template;
    }

    addEvents() {
        this.handleDrag();
        //this.handleClick();
    }
    
    handleClick(){
        let self = this;
        ['mouseup', 'touchend'].forEach(evt =>
            self.addEventListener(evt, function (e) {
                let relativeBottom;
                const rect = self.getBoundingClientRect();
                if( e.type == "mouseup" ){
                    relativeBottom = Math.abs(e.clientY - rect.bottom);
                }else{
                    relativeBottom = Math.abs(e.touches[0].pageY - rect.bottom);
                }
                let percent = self.getPosPercent(relativeBottom);
                self.setPercent( percent );
                return false;
            }, false)
        );
    }
  
    handleDrag() {
        let self = this;
        ['drag', 'touchmove'].forEach(evt =>
            self.handleEl.addEventListener(evt, function (e) {
                const target = e.target.parentElement;
                const rect = target.getBoundingClientRect();

                let relativeBottom;
                if( e.type == "drag" ){
                    relativeBottom = e.clientY - rect.bottom;
                }else{
                    relativeBottom = e.touches[0].pageY - rect.bottom;
                }
                if( relativeBottom > 0 ){ return; }
            
                self.updateDisplayPixel( Math.abs(relativeBottom) );
                e.preventDefault();
                return false;
            }, false)
        );

        ['dragstart', 'touchstart', "click"].forEach(evt =>
            self.handleEl.addEventListener(evt, function (e) {
                let body = self.handleEl.closest("body");
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
            self.handleEl.addEventListener(evt, function (e) {
                if( self.userEvents.stop !== null ){
                    self.userEvents.stop(self.percent);
                }
                let body = self.handleEl.closest("body");
                if( body ){
                    body.style["touch-action"] = "auto";
                }
                self.setAttribute("touching",false);
                return false;
            }, false)
        );
    }

    scale (number, inMin, inMax, outMin, outMax) {
        return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    getReversePercent(){
        return this.scale(this.percent,100,0,0,100);
    }
    
    getPosPixel() {
        let height = this.offsetHeight;
        return this.clamp( ((height / 100) * this.percent) - (this.handleHeight / 2) );
    }

    getPosPercent(pixel) {
        let rawPercent = (this.maxPercent / this.offsetHeight) * pixel;
        // Don't want to deal with float
        return Math.round( rawPercent );
    }

    refreshDisplayPercent() {
        this.lowerHalfEl.style.height   = `${this.percent}%`;
        this.handleEl.style.bottom      = `${this.getPosPixel()}px`;
        this.percentHolderEl.innerText  = `${this.percent}%`;
        this.setFullPercentStyle();
    }

    updateDisplayPixel(pixel) {
        if (pixel < 0 || pixel > this.offsetHeight) { return; }
        let percent = this.getPosPercent(pixel);
        if( percent > this.maxPercent ){ return; }
        this.percent = percent;
        let posPercentString = `${this.percent}%`
        this.lowerHalfEl.style.height   = `${pixel}px`;
        this.handleEl.style.bottom      = `${pixel - (this.handleHeight / 2)}px`;
        this.percentHolderEl.innerText  = posPercentString;
        this.setFullPercentStyle();

        if( this.userEvents.drag !== null ){
            this.userEvents.drag(this.percent);
        }
    }

    setFullPercentStyle(){
        if( this.percent >= this.maxPercent-2 ){
            this.classList.add("atFull");
        }else{
            this.classList.remove("atFull");
        }
    }

    clamp(val, min, max) {
        return val > max ? max : val < min ? min : val;
    }

    setPercent(percent) {
        if (percent > this.maxPercent || percent < 0) {
            console.error(`[HSH-Brightness] - Percent must be between 0 and ${this.maxPercent}%!`);
        }
        this.percent = percent;
        this.refreshDisplayPercent();
    }
};
customElements.define('hs-brightness', hsBrightness);