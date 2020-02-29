import base from "/apogeeutil/base.js";
import { Model, doAction } from "/apogee/apogeeCoreLib.js";
import EventManager from "/apogeeutil/EventManagerClass.js";

/** This class manages the user interface for a model object. */
export default class ModelManager extends EventManager {

    constructor(workspaceManager) {
        super();

        this.workspaceManager = workspaceManager;
        this.app = workspaceManager.getApp();
        this.model = null;

        this.clearUpdated();

        this.viewStateCallback = null;
        this.cachedViewState = null;
      
        this.componentMap = {};
    }

    //====================================
    // Model Management
    //====================================

    /** This gets the application instance. */
    getApp() {
        return this.app;
    }

    getWorkspaceManager() {
        return this.workspaceManager;
    }

    setViewStateCallback(viewStateCallback) {
        this.viewStateCallback = viewStateCallback;
    }

    getCachedViewState() {
        return this.cachedViewState;
    }

     /** This method loads the model data and model components from the json. */
    load(json) {

        let modelJson; 
        let componentsJson;

        if(json) {
            modelJson = json.model;
            componentsJson = json.components;

            //set the view state
            if(json.viewState !== undefined) {
                this.cachedViewState = json.viewState;
            }
        }

        //load defaults if there is not saved model data
        if(!modelJson) modelJson = Model.EMPTY_MODEL_JSON;
        if(!componentsJson) componentsJson = ModelManager.EMPTY_MODEL_COMPONENT_JSON;

        //create model
        this.model = new Model();
        
        //add listeners
        //this.model.addListener("created", eventInfo => this.objectCreated(eventInfo));
        this.model.addListener("updated", eventInfo => this.objectUpdated(eventInfo));
        this.model.addListener("deleted", eventInfo => this.objectDeleted(eventInfo));

        //load the model
        let loadAction = {};
        loadAction.action = "loadModel";
        loadAction.modelJson = modelJson;
        let actionResult = doAction(this.model,loadAction);

        //create the return result
        let commandResult = {};

        if(actionResult.actionDone) {
            commandResult.action = "updated";
            commandResult.cmdDone = true;
            commandResult.target = this;
            commandResult.dispatcher = this;

            //set up the root folder conmponent, with children if applicable
            var rootFolder = this.model.getRoot();
            if(rootFolder) {
                let rootFolderComponentJson = componentsJson[rootFolder.getName()];
                var rootFolderCommandResult = this.createComponentFromMember(rootFolder,rootFolderComponentJson);
                commandResult.childCommandResults = [rootFolderCommandResult];
            }

            commandResult.actionResult = actionResult;
        }
        else {
            commandResult.cmdDone = false;
            commandResult.errorMsg = "Error opening workspace model";
        }

        return commandResult;
    }

    /** This method gets the model object. */
    getModel() {
        return this.model;
    }

    /** This method closes the model object. */
    close() {
        //delete all the components - to make sure the are cleaned up
        for(var key in this.componentMap) {
            var componentInfo = this.componentMap[key];
            if((componentInfo)&&(componentInfo.component)&&(!componentInfo.componentMember)) {
                componentInfo.component.onDelete();
            }
        }
    }

    //------------------------------------------
    // Event Tracking Methods
    //------------------------------------------

    getUpdated() {
        return this.updated;
    }

    isFieldUpdated(field) {
        return this.updated[field] ? true : false;
    }

    clearUpdated() {
        this.updated = {};
    }

    fieldUpdated(field) {
        this.updated[field] = true;
    }

    getId() {
        //right now we allow for just one model manager
        return 1;
    }

    getTargetType() {
        return "modelManager";
    }

    //====================================
    // Component Management
    //====================================

    /** This method returns a component by full name. */
    getComponentByFullName(fullName) {
        let member = this.model.getMemberByFullName(fullName);
        if(member) {
            return this.getComponent(member);
        }
        else {
            return undefined;
        }
    }

    /** This method gets the component associated with a member object. */
    getComponent(member) {
        var componentInfo = this.componentMap[member.getId()];
        if(componentInfo) {
            return componentInfo.component;
        }
        else {
            return null;
        }
    }

    /** This method gets the component associated with a member object. */
    getComponentById(memberId) {
        var componentInfo = this.componentMap[memberId];
        if(componentInfo) {
            return componentInfo.component;
        }
        else {
            return null;
        }
    }

    /** This returns the list of folder names. */
    getFolders() {
        var folders = []
        for(var key in this.componentMap) {
            var componentInfo = this.componentMap[key];
            var member = componentInfo.member;
            if((member.isParent)&&(member.getChildrenWriteable())) { 
                folders.push(member.getFullName());
            }
        }
        return folders;
    }

    /** This method registers a member data object and its associated component object.
     * If the member is not the main member assoicated with component but instead an included
     * member, the main componentMember should be passed in also. Otherwise it should be left 
     * undefined. */
    registerMember(member,component,mainComponentMember) {

        //make sure this is for us
        if(member.getModel() !== this.model) {
            throw base.createError("Component registered in wrong model: " + member.getFullName());
        }

        //store the ui object
        var memberId = member.getId();

        if(this.componentMap[memberId]) {
            //already exists! (we need to catch this earlier if we want it to not be fatal. But we should catch it here too.)
            throw base.createError("There is already a member with the given ID.",true);
        }

        var componentInfo = {};
        componentInfo.member = member;
        componentInfo.component = component;
        if(mainComponentMember) componentInfo.componentMember = mainComponentMember;

        this.componentMap[memberId] = componentInfo;

    }
    
    testPrint(eventInfo) {
        if(eventInfo.updated) {
            console.log(JSON.stringify(eventInfo.updated));
        }
    }
        
    createComponentFromMember(member,componentJson) {
        
        //response - get new member
        var component;
        var commandResult = {};

        if(member) {
            
            var componentClass = this.app.getComponentClass(componentJson.type);
            if((componentClass)&&(member.constructor.generator.type != "apogee.ErrorTable")) {
                //create empty component
                component = new componentClass(this,member);

                //apply any serialized values
                if(componentJson) {
                    component.loadPropertyValues(componentJson);
                }
            }

            //if we failed to create the component, or if we failed to make the member properly (and we used the error member)
            if(!component) {
                //table not found - create an empty table
                componentClass = this.app.getComponentClass("apogeeapp.app.ErrorTableComponent");
                component = new componentClass(this,member);
                if(componentJson) {
                    component.loadProperties(componentJson);
                }
            }

        }

        if(!component) {
            commandResult.cmdDone = false;
            commandResult.errorMsg = "Component creation failed: " + member.getName();
        }
        else {
            commandResult.target = component;
            commandResult.dispatcher = this;
            commandResult.cmdDone = true;
            commandResult.action = "created";

            //load the children, if there are any (BETTER ERROR CHECKING!)
            if(componentJson.children) {
                let folderMember = component.getParentFolderForChildren();
                let childCommandResults = this.loadFolderComponentContentFromJson(folderMember,componentJson.children);
                if((childCommandResults)&&(childCommandResults.length > 0)) {
                    commandResult.childCommandResults = childCommandResults;
                } 
            }
        }
            
        return commandResult;
    }

    objectCreated(eventInfo) {
        if(!eventInfo.target) return;
        
        if(eventInfo.target.getTargetType() == "member") {
            this.memberCreated(eventInfo.target);
        }
    }

    objectUpdated(eventInfo) {
        if(!eventInfo.target) return;
        
        if(eventInfo.target.getTargetType() == "member") {
            this.memberUpdated(eventInfo.target);
        }
        else if(eventInfo.target.getTargetType() == "model") {
            this.modelUpdated(eventInfo.target);
        }
    }

    objectDeleted(eventInfo) {
        if(!eventInfo.target) return;
        
        if(eventInfo.target.getTargetType() == "member") {
            this.memberDeleted(eventInfo.target);
        }
    }

    /** This method responds to a member updated. */
    memberCreated(member) {
    }


    /** This method responds to a member updated. */
    memberUpdated(member) {
        var key = member.getId();

        var componentInfo = this.componentMap[key];
        if((componentInfo)&&(componentInfo.component)) {
            componentInfo.component.memberUpdated(eventInfo);
        }
    }

    modelUpdated(model) {
        let fieldsUpdated = model.getUpdated();
        
        //check for name changes
        if(apogeeutil.isFieldUpdated(fieldsUpdated,"name")) {
            this.fieldUpdated("name");
        }
    }

    /** This method responds to a "new" menu event. */
    memberDeleted(member) {
        var memberId = member.getId();

        var componentInfo = this.componentMap[memberId];
        delete this.componentMap[memberId];

        if((componentInfo)&&(componentInfo.component)) {
            //do any needed cleanup
            componentInfo.component.onDelete();
        }
    }

    //====================================
    // open and save methods
    //====================================

    /** This retrieves the file metadata used to save the file. */
    getFileMetadata() {
        return this.fileMetadata;
    }

    /** This saves the model. It the optionalSavedRootFolder is passed in,
     * it will save a model with that as the root folder. */
    toJson(optionalSavedRootFolder) {

        let json = {};

        //get the model json
        json.model = this.model.toJson(optionalSavedRootFolder);

        //get the components json
        let componentsJson = {};

        var rootFolder;
        if(optionalSavedRootFolder) {
            rootFolder = optionalSavedRootFolder;
        }
        else {
            rootFolder = this.model.getRoot();
        }
        var rootFolderComponent = this.getComponent(rootFolder);

        componentsJson[rootFolder.getName()] = rootFolderComponent.toJson();
        json.components = componentsJson;

        //model view state
        if(this.viewStateCallback) {
            this.cachedViewState = this.viewStateCallback();
            if(this.cachedViewState) componentsJson.viewState = this.cachedViewState;
        }

        return json;
    }

    /** This is used in saving the active tab 
     * @private */
    getMemberNameFromId(activeTabId) {
        var component = this.getComponentById(activeTabId);
        if(component) {
            var member = component.getMember();
            if(member) {
                return member.getFullName();
            }
        }
        return undefined;
    }

    //================================
    // Folder child methods
    // The following methods are standard methods to serialize and deserialize the children in a folder. This
    // can be used by different folder component representations.
    //================================

    getFolderComponentContentJson(folder) {
        var json = {};
        var tableMap = folder.getChildMap();
        for(var key in tableMap) {
            var child = tableMap[key];

            //get the object map for the model
            var childComponent = this.getComponent(child);

            //get the component for this child
            var name = child.getName();
            json[name] = childComponent.toJson();
        }
        return json;
    }
    
    loadFolderComponentContentFromJson(parentMember,childrenJson) {
        let childCommandResults = [];
        for(let childName in childrenJson) {
            let childMember = parentMember.lookupChild(childName);
            if(childMember) {
                let childComponentJson = childrenJson[childName];
                var childCommandResult = this.createComponentFromMember(childMember,childComponentJson);
                childCommandResults.push(childCommandResult);
            }
        };

        return childCommandResults;
    }

    //==================================
    // DEV FUNCTION
    //==================================

    showDependencies() {
        console.log(JSON.stringify(this.createDependencies()));
    }

    createDependencies() {
        var memberInfo = {};

        for(var key in this.componentMap) {
            var componentInfo = this.componentMap[key];
            if((componentInfo)&&(componentInfo.member)) {


                var member = componentInfo.member;

                var memberStruct = {};
                memberStruct.type = member.constructor.generator.type;
                var parent = member.getParent();
                memberStruct.parent = parent ? parent.getFullName() : null;

                if(member.isDependent) {
                    let dependsOnList = member.getDependsOn();
                    if(dependsOnList.length > 0) {
                        memberStruct.dep = dependsOnList.map(dependencyId => {
                            let dependency = this.model.lookupMember(dependencyId);
                            dependency.getFullName()
                        });
                    }
                }

                memberInfo[member.getFullName()] = memberStruct;
            }
        }

        return memberInfo;
    }

}

//this is the json for an empty model
ModelManager.EMPTY_MODEL_COMPONENT_JSON = {
    "Main": {
        "type":"apogeeapp.app.FolderComponent"
    }
};
