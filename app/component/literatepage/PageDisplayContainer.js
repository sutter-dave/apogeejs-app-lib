import {getSaveBar} from "/apogeeapp/app/component/toolbar.js";

/** This is a standin for the display conatiner for the literate page
 * 
 * @class 
 */
export default class PageDisplayContainer {

    constructor(component, viewType, isMainView, options) {
        
        //set the options
        if(!options) {
            options = {};
        }
        
        //variables
        this.isMainView = isMainView;
        this.options = options;
        
        this.mainElement = null;
        this.viewTitleBarElement = null;
        this.componentViewLabelContainer = null;
        this.headerContainer = null;
        this.viewContainer = null;
        
        this.isComponentShowing = false;
        this.isComponentActive = false;
        this.isViewActive = isMainView;
        this.isContentLoaded = false;
        
        this.destroyViewOnInactive = true;
        
        this.inEditMode = false;
        
        this.content = null;
        
        this.component = component;
        this.viewType = viewType;
        this.dataDisplay = null;
        
        //initialize
        this.initUI();
    }

    //-------------------
    // state management
    //-------------------

    /** This method should be called whent the frame parent is loaded or unloaded from the DOM. */
    setIsComponentShowing(isComponentShowing) {
        this.isComponentShowing = isComponentShowing;
        this.updateDataDisplayLoadedState();
    }

    /** This returns the isComponentShowing status of the display. */
    getIsComponentShowing() {
        return this.isComponentShowing;
    }

    /** This method should be called whent the frame parent is loaded or unloaded from the DOM. */
    setIsComponentActive(isComponentActive) {
        this.isComponentActive = isComponentActive;
        this.updateDataDisplayLoadedState();
    }

    /** This returns the isComponentShowing status of the display. */
    getIsComponentActive() {
        return this.isComponentActive;
    }

    /** This method should be called whent the frame parent is loaded or unloaded from the DOM. */
    setIsViewActive(isViewActive) {
        this.isViewActive = isViewActive;
        //show/hide ui elements
        if(isViewActive) {
            this.mainElement.style.display = ""; 
            this.expandImage.style.display = "none";
            this.contractImage.style.display = "";
//            this.componentViewLabelContainer.style.display = "none";
        }
        else {
            this.mainElement.style.display = "none";
            this.expandImage.style.display = "";
            this.contractImage.style.display = "none";
//            this.componentViewLabelContainer.style.display = "";
        }
        
        //this lets the data display know if its visibility changes
        this.updateDataDisplayLoadedState();
    }

    /** This method closes the window. If the argument forceClose is not
     * set to true the "request_close" handler is called to check if
     * it is ok to close the window. */
    close(forceClose) {

        if(!forceClose) {
            //make a close request
            var requestResponse = this.callHandler(apogeeapp.ui.REQUEST_CLOSE,this);
            if(requestResponse == apogeeapp.ui.DENY_CLOSE) {
                //do not close the window
                return;
            }
        }

        this.dispatchEvent(apogeeapp.ui.CLOSE_EVENT,this);
    }

    //---------------------------
    // GUI ELEMENT
    //---------------------------

    /** This method returns the view label element to be used in the component title bar. */
    getViewLabelElement() {
        return this.componentViewLabelContainer;
    }

    /** This method returns the main dom element for the window frame. */
    getDisplayElement() {
        return this.mainElement;
    }

    //====================================
    // Initialization Methods
    //====================================

    /** @private */
    initUI() {
        
        //make the container
        this.mainElement = apogeeapp.ui.createElementWithClass("div","visiui_displayContainer_mainClass",null);
        
        //make the view title bar element
        this.viewTitleBarElement = apogeeapp.ui.createElementWithClass("div","visiui_displayContainer_viewTitleBarClass",this.mainElement);

        this.viewTitleActiveElement = apogeeapp.ui.createElementWithClass("div","visiui_displayContainer_viewTitleActiveClass",this.viewTitleBarElement);

        let mainTitleLabelText = this.getMainViewLabelText();
        if(mainTitleLabelText) {
            this.viewTitleElement = apogeeapp.ui.createElementWithClass("div","visiui_displayContainer_componentViewTitleClass",this.viewTitleBarElement);
            this.viewTitleElement.innerHTML = mainTitleLabelText;
        }
        
        //make the label for the view in the componennt title bar
        this.componentViewLabelContainer = apogeeapp.ui.createElementWithClass("div","visiui_displayContainer_componentViewLabelClass",null);

        let headerTitleLabelClass = this.getHeaderViewLabelClass();
        let headerTitleLabelText = this.getHeaderViewLabelText();

        this.componentViewActiveElement = apogeeapp.ui.createElementWithClass("div","visiui_displayContainer_componentViewActiveClass",this.componentViewLabelContainer);
        this.componentViewTitleElement = apogeeapp.ui.createElementWithClass("div",headerTitleLabelClass,this.componentViewLabelContainer);
        
        this.componentViewTitleElement.innerHTML = headerTitleLabelText;

        this.expandImage = apogeeapp.ui.createElementWithClass("img","visiui_displayContainer_expandContractClass",this.componentViewActiveElement);
        this.expandImage.src = apogeeapp.ui.getResourcePath(PageDisplayContainer.COMPONENT_LABEL_EXPAND_BUTTON_PATH);
        this.expandImage.onclick = () => this.setIsViewActive(true);
//these lines if contract on title bar        
        this.contractImage = apogeeapp.ui.createElementWithClass("img","visiui_displayContainer_expandContractClass",this.componentViewActiveElement);
        this.contractImage.src = apogeeapp.ui.getResourcePath(PageDisplayContainer.VIEW_TITLE_CONTRACT_BUTTON_PATH);
        this.contractImage.onclick = () => this.setIsViewActive(false);

//these lines if contract on data display
//        this.contractImage = apogeeapp.ui.createElementWithClass("img","visiui_displayContainer_expandContractClass",this.viewTitleActiveElement);
//        this.contractImage.src = apogeeapp.ui.getResourcePath(PageDisplayContainer.VIEW_TITLE_CONTRACT_BUTTON_PATH);
//        this.contractImage.onclick = () => this.setIsViewActive(false);
        
        //add the header elment (for the save bar)
        this.headerContainer = apogeeapp.ui.createElementWithClass("div","visiui_displayContainer_headerContainerClass",this.mainElement);
        
        //add the view container
        this.viewContainer = apogeeapp.ui.createElementWithClass("div","visiui_displayContainer_viewContainerClass",this.mainElement);
        
        //TODO - resize element!!!
        
        //set the visibility state for the element
        this.setIsViewActive(this.isViewActive);
    }

    getHeaderViewLabelClass() {
        if(this.isMainView) {
            return "visiui_pageChild_titleBarTitleClass";
        }
        else {
            return "visiui_displayContainer_componentViewTitleClass";
        }
    }

    /** This method returns the text for the view label.  */
    getHeaderViewLabelText() {

        if(this.isMainView) {
            return this.component.getMember().getDisplayName();
        }
        else {
            return this.viewType;
        }
    }

    /** This method returns the text for the view label.  */
    getMainViewLabelText() {

        if(this.isMainView) {
            return null;
        }
        else {
            return this.viewType;
        }
    }

    /** This method shold be called when the content loaded or frame visible state 
     * changes to manage the data display.
     * private */
    updateDataDisplayLoadedState() {
        
        if((this.isComponentShowing)&&(this.isComponentActive)&&(this.isViewActive)) {
            if(!this.dataDisplayLoaded) {
                if(!this.dataDisplay) {
                    //the display should be created only when it is made visible
                    this.dataDisplay =  this.component.getDataDisplay(this,this.viewType);
                    this.setContent(this.dataDisplay.getContent(),this.dataDisplay.getContentType());
                    this.dataDisplay.showData();
                }
            
                if(this.dataDisplay.onLoad) this.dataDisplay.onLoad();
                this.dataDisplayLoaded = true;
            }
        }
        else {
            if(this.dataDisplay) {
                if(this.dataDisplayLoaded) {
                    this.dataDisplayLoaded = false;
                    if(this.dataDisplay.onUnload) this.dataDisplay.onUnload();
                }
                
                //we will destroy the display is the destroyViewOnInactive flag is set, and we are inactive
                if((this.destroyViewOnInactive)&&((!this.isComponentActive)||(!this.isViewActive))) {
                    //remove content
                    this.safeRemoveContent();
                    //destroy the display
                    if(this.dataDisplay.destroy) this.dataDisplay.destroy();
                    this.dataDisplay = null;
                }
            }  
        }
        
            
        //fyi - this is remove code, when we need to add it
        //[]
    }

    //------------------------------
    // standard methods
    //------------------------------

    /** The displayDestroyFlags indicate when the display for this view mode will be destroyed,
     * refering to times it is not visible to the user. See further notes in the constructor
     * description. */
    setDisplayDestroyFlags(displayDestroyFlags) {
        
        //note - I should probably update app to only use this one flag.
        this.destroyViewOnInactive = (displayDestroyFlags & PageDisplayContainer.DISPLAY_DESTROY_FLAG_INACTIVE != 0);
    }   

    /** This method cleasr the data display. It should only be called when the data display is not showing. 
     * maybe allow this when the display is showing - unload and reload it*/
    forceClearDisplay() {
        alert("Implement forceClearDisplay!");
    }

    /** This method destroys the data display. */
    destroy() {
        if((this.dataDisplay)&&(this.dataDisplay.destroy)) {
            this.dataDisplay.destroy();
            this.dataDisplay = null;
        }
    }

    /** This method should be called called before the view mode is closed. It should
     * return true or false. NO - IT RETURNS SOMETHING ELSE! FIX THIS! */
    isCloseOk() {
        if(this.dataDisplay) {
            if(this.dataDisplay.isCloseOk) {
                return this.dataDisplay.isCloseOk();
            }
            
            if(this.inEditMode) {
                return DisplayContainer.UNSAVED_DATA;
            }
        }
        
        return DisplayContainer.CLOSE_OK;
    }
        
    /** This method is called when the member is updated, to make sure the 
    * data display is up to date. */
    memberUpdated() {
        if((this.dataDisplay)&&(!this.inEditMode)) {
            this.dataDisplay.showData();
        }
    }
        
    //------------------------------
    // Accessed by the Editor, if applicable
    //------------------------------

    onCancel() {
        //reload old data
        this.dataDisplay.showData();
        
        return true;
    }

    startEditMode(onSave,onCancel) {
        if(!this.inEditMode) {
            this.inEditMode = true;
            var saveBar = getSaveBar(onSave,onCancel);
            this.setHeaderContent(saveBar);
        }
    }

    endEditMode() {
        if(this.inEditMode) {
            this.inEditMode = false;
            this.setHeaderContent(null);
        }
    }

    isInEditMode() {
        return this.inEditMode;
    }


    //====================================
    // Internal Methods
    //====================================

    /** This sets the content for the window. If null (or otherwise false) is passed
     * the content will be set to empty.*/
    setHeaderContent(contentElement) {
        apogeeapp.ui.removeAllChildren(this.headerContainer);
        if(contentElement) {
            this.headerContainer.appendChild(contentElement);
        }
    }

    /** This sets the content for the window. The content type
     *  can be:
     *  apogeeapp.ui.RESIZABLE - for this content, the content is resized to fit the plane frame. The place frame should be initialized with a size.
     *  apogeeapp.ui.FIXED_SIZE - for this content, the plain frame is sized to fit the content. ITs size should not be externally set.
     *  apogeeapp.ui.SIZE_WINDOW_TO_CONTENT - this is not a content type but a input option for content FIXED_SIZE that shrinks the window to fit the content. It is typically only used for dialog boxes so isn't really relevent here.
     */
    setContent(contentElement,elementType) {
        
        apogeeapp.ui.removeAllChildren(this.viewContainer);
        
    //    //set the body type
    //    var bodyClassName;
    //    if(elementType == apogeeapp.ui.RESIZABLE) {
    //       bodyClassName = "visiui-dnh-fixed";
    //    }
    //    else if(elementType == apogeeapp.ui.FIXED_SIZE) {
    //        bodyClassName = "visiui-dnh-shrink-to-fit";
    //    }
    //    else if(elementType == apogeeapp.ui.SIZE_WINDOW_TO_CONTENT) {
    //        bodyClassName = "visiui-dnh-shrink-to-fit";
    //    }
    //    else {
    //        throw new Error("Unknown content type: " + elementType);
    //    }
    //    this.displayAndHeader.setBodyType(bodyClassName);
        
        //set the content
        this.viewContainer.appendChild(contentElement);
        this.content = contentElement;
    }

    /** This method removes the given element from the content display. If the element
     * is not in the content display, no action is taken. */
    safeRemoveContent() {
        for(var i = 0; i < this.viewContainer.childNodes.length; i++) {
            var node = this.viewContainer.childNodes[i];
            if(node === this.content) {
                this.viewContainer.removeChild(this.content);
                this.content = null;
            }
        }
    }

}

/** This method returns the main dom element for the window frame. */
PageDisplayContainer.COMPONENT_LABEL_EXPAND_BUTTON_PATH = "/closed_gray.png";
PageDisplayContainer.VIEW_TITLE_CONTRACT_BUTTON_PATH = "/opened_gray.png";



