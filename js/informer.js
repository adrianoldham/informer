var Informer = Class.create({
    options: {
        cleanClass: "clean",
        
        // For showing errors
        errorClass: "error",
        
        // For validating        
        requiredClass: "required"          // Set a textbox's class to required if it needs to be validated
    },
    
    initialize: function(selector, options) {
        this.options = Object.extend(Object.extend({ }, this.options), options || { });     
        
        this.elements = $$(selector).map(function(element) {
            return new Informer.Element(element, this, this.options)
        }.bind(this));
    }
});

// Different states the Informer fields can be in
Informer.States = {
    Clean: "Informer.States.Clean",
    Dirty: "Informer.States.Dirty"
};

Informer.Element = Class.create({
    options: {
    },
    
    initialize: function(element, parent, options) {
        this.options = Object.extend(Object.extend({ }, this.options), options || { });
        this.element = $(element);
        this.parent = $(parent);
        
        // Default text is read from the title attribute
        this.defaultText = this.element.readAttribute('title');
        
        this.element.observe('focus', this.dirtify.bind(this));
        this.element.observe('blur', this.update.bind(this));
        
        this.update();
        
        // Onload and default, then it means it was a refresh, so clean it
        if (this.element.value == this.defaultText) {
            this.setState(Informer.States.Clean);
        }
        
        // Attach validation to form submit
        this.setupForm();
    },
    
    findForm: function() {
        // Find the form of this element
        var element = this.element;
        
        while (element.tagName.toLowerCase() != "form") {
            element = $(element.parentNode);
            if (element == null || element.tagName == null) return null;
        }
        
        return element;
    },
    
    setupForm: function() {
        this.form = this.findForm();
        
        if (this.form != null) {
            this.form.observe("submit", this.validate.bindAsEventListener(this));   
        }
    },
    
    shouldValidate: function() {
        return this.element.hasClassName(this.options.requiredClass);
    },
    
    hasError: function() {
        return this.state == Informer.States.Clean && this.shouldValidate();
    },
    
    validate: function(event) {
        // If we don't validate, then exit, but make sure the do not validate is reset
        if (this.doNotValidate) {
            this.doNotValidate = false;
            return;
        }
        
        // If clean and required, then validate has error
        if (this.hasError()) {
            event.stop();
            this.element.addClassName(this.options.errorClass);
            
            this.form.hasInformerError = true;
            
            // Since we have error, make sure we maintain the 'default text' of clean fields
            this.parent.elements.each(function(element) {
                if (element != this && !element.shouldValidate()) {
                    element.doNotValidate = true;
                }
            }.bind(this));
            
            return;
        }
        
        // If submitted and the state is clean, then make sure the value is clean as well
        if (this.state == Informer.States.Clean) {
            this.element.value = "";
        }
    },
    
    dirtify: function() {
        if (this.state == Informer.States.Clean) {
            this.element.value = '';
        }
        
        this.element.removeClassName(this.options.errorClass);
        this.setState(Informer.States.Dirty);
    },
    
    update: function() {
        // If default is empty, then it's clean, else it's dirty
        if (this.element.value == "") {
            this.setState(Informer.States.Clean);
        } else {
            this.setState(Informer.States.Dirty);
        }
    },
    
    setState: function(state) {
        this.state = state;
        
        switch (this.state) {
            // If clean, then show default text and use clean class
            case Informer.States.Clean:
                this.element.addClassName(this.options.cleanClass);
                this.element.value = this.defaultText;
                
                break;
            // Otherwise, don't use clean class and show existing text
            case Informer.States.Dirty:
                this.element.removeClassName(this.options.cleanClass);
                break;
        }
    }
});