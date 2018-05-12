/** This component represents a json table object. */
apogeeapp.app.FormTableComponent = function(workspaceUI,folder) {
    //extend edit component
    apogeeapp.app.EditComponent.call(this,workspaceUI,folder,apogeeapp.app.FormTableComponent);
    
    //load these!
    this.dataTable = folder.lookupChildFromPathArray(["data"]) ;
    this.layoutTable = folder.lookupChildFromPathArray(["layout"]) ;
    
    //keep the form display alive
    this.displayDestroyFlags = apogeeapp.app.ViewMode.DISPLAY_DESTROY_FLAG_NEVER;
    
    //add a cleanup and save actions
    this.addOpenAction(apogeeapp.app.FormTableComponent.readFromJson);
    this.addSaveAction(apogeeapp.app.FormTableComponent.writeToJson);
};

apogeeapp.app.FormTableComponent.prototype = Object.create(apogeeapp.app.EditComponent.prototype);
apogeeapp.app.FormTableComponent.prototype.constructor = apogeeapp.app.FormTableComponent;

//==============================
// Protected and Private Instance Methods
//==============================

apogeeapp.app.FormTableComponent.VIEW_FORM = "Form";
apogeeapp.app.FormTableComponent.VIEW_LAYOUT_CODE = "Layout Code";
apogeeapp.app.FormTableComponent.VIEW_LAYOUT_SUPPLEMENTAL_CODE = "Layout Private";
apogeeapp.app.FormTableComponent.VIEW_FORM_VALUE = "Form Value";
apogeeapp.app.FormTableComponent.VIEW_DESCRIPTION = "Notes";

apogeeapp.app.FormTableComponent.VIEW_MODES = [
    apogeeapp.app.FormTableComponent.VIEW_FORM,
    apogeeapp.app.FormTableComponent.VIEW_LAYOUT_CODE,
    apogeeapp.app.FormTableComponent.VIEW_LAYOUT_SUPPLEMENTAL_CODE,
    apogeeapp.app.FormTableComponent.VIEW_FORM_VALUE,
    apogeeapp.app.FormTableComponent.VIEW_DESCRIPTION
];

apogeeapp.app.FormTableComponent.TABLE_EDIT_SETTINGS = {
    "viewModes": apogeeapp.app.FormTableComponent.VIEW_MODES,
    "defaultView": apogeeapp.app.FormTableComponent.VIEW_FORM,
}

/**  This method retrieves the table edit settings for this component instance
 * @protected */
apogeeapp.app.FormTableComponent.prototype.getTableEditSettings = function() {
    return apogeeapp.app.FormTableComponent.TABLE_EDIT_SETTINGS;
}

/** This method should be implemented to retrieve a data display of the give type. 
 * @protected. */
apogeeapp.app.FormTableComponent.prototype.getDataDisplay = function(viewMode,viewType) {
	
    var callbacks;
    
	//create the new view element;
	switch(viewType) {
            
        case apogeeapp.app.FormTableComponent.VIEW_FORM:
            viewMode.setDisplayDestroyFlags(this.displayDestroyFlags);
            callbacks = this.getFormEditorCallbacks();
            var formEditorDisplay = new apogeeapp.app.ConfigurableFormEditor(viewMode,callbacks);
            return formEditorDisplay;
			
		case apogeeapp.app.FormTableComponent.VIEW_LAYOUT_CODE:
            callbacks = apogeeapp.app.dataDisplayCallbackHelper.getMemberFunctionBodyCallbacks(this.layoutTable,apogeeapp.app.FormTableComponent.TABLE_EDIT_SETTINGS.emptyDataValue);
			return new apogeeapp.app.AceTextEditor(viewMode,callbacks,"ace/mode/javascript");
			
		case apogeeapp.app.FormTableComponent.VIEW_LAYOUT_SUPPLEMENTAL_CODE:
			callbacks = apogeeapp.app.dataDisplayCallbackHelper.getMemberSupplementalCallbacks(this.layoutTable,apogeeapp.app.FormTableComponent.TABLE_EDIT_SETTINGS.emptyDataValue);
            return new apogeeapp.app.AceTextEditor(viewMode,callbacks,"ace/mode/javascript");
        
        case apogeeapp.app.FormTableComponent.VIEW_FORM_VALUE:
            callbacks = apogeeapp.app.dataDisplayCallbackHelper.getMemberDataTextCallbacks(this.dataTable);
            return new apogeeapp.app.AceTextEditor(viewMode,callbacks,"ace/mode/json");
            
        case apogeeapp.app.FormTableComponent.VIEW_DESCRIPTION:
			callbacks = apogeeapp.app.dataDisplayCallbackHelper.getMemberDescriptionCallbacks(this.dataTable);
            //return new apogeeapp.app.AceTextEditor(viewMode,callbacks,"ace/mode/text");
            return new apogeeapp.app.TextAreaEditor(viewMode,callbacks);
			
		default:
//temporary error handling...
			alert("unrecognized view element!");
			return null;
	}
}

apogeeapp.app.FormTableComponent.prototype.getFormEditorCallbacks = function() {
    var callbacks = {};
    
    //return desired form value
    callbacks.getData = () => this.dataTable.getData();
    
    //return form layout
    callbacks.getLayoutInfo = () => this.layoutTable.getData();
    
    //edit ok - always true
    callbacks.getEditOk = () => true;
    
    //save data - just form value here
    var messenger = new apogee.action.Messenger(this.layoutTable);
    callbacks.saveData = (formData) => {
        if(this.checkDataInvalid) {
            //check data invalid returns false or a message
            var invalidResult = this.checkDataInvalid(formData);
            if(invalidResult) {
                alert(invalidResult.errorMessage);
                return false;
            }
        }

        messenger.dataUpdate("data",formData);
        return true;
    }
    
    return callbacks;
}

//======================================
// Static methods
//======================================

apogeeapp.app.FormTableComponent.getCreateMemberPayload = function(userInputValues) {
    var json = {};
    json.name = userInputValues.name;
    json.type = apogee.Folder.generator.type;
    //add the children
    json.children = {
        "layout": {
            "name": "layout",
            "type": "apogee.JsonTable",
            "updateData": {
                "data": "",
                "description": ""
            }
        },
        "data": {
            "name": "data",
            "type": "apogee.JsonTable",
            "updateData": {
                "data": "",
                "description": ""
            }
        }
    };
    return json;
}

apogeeapp.app.FormTableComponent.writeToJson = function(json) {
    json.dataView = this.dataView;
}

apogeeapp.app.FormTableComponent.readFromJson = function(json) {
    if(json.dataView !== undefined) {
        this.dataView = json.dataView;
    }
}

//======================================
// This is the component generator, to register the component
//======================================

apogeeapp.app.FormTableComponent.displayName = "Form Table";
apogeeapp.app.FormTableComponent.uniqueName = "apogeeapp.app.FormTableComponent";
apogeeapp.app.FormTableComponent.DEFAULT_WIDTH = 300;
apogeeapp.app.FormTableComponent.DEFAULT_HEIGHT = 300;
apogeeapp.app.FormTableComponent.ICON_RES_PATH = "/componentIcons/formControl.png";

