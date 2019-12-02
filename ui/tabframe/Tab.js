import base from "/apogeeutil/base.js";
import EventManager from "/apogeeutil/EventManagerClass.js";
import Menu from "/apogeeapp/ui/menu/Menu.js";
import DisplayAndHeader from "/apogeeapp/ui/displayandheader/DisplayAndHeader.js";
import apogeeui from "/apogeeapp/ui/apogeeui.js";

export default class Tab extends EventManager {

    constructor(id) {
        super();
        
        this.tabFrame = null;
        this.id = id;
        this.tabLabelElement = apogeeui.createElementWithClass("div","visiui-tf-tab-base visiui-tf-tab-inactive");
        
        this.menuContainer = apogeeui.createElementWithClass("div","visiui-tf_tab-menuDiv",this.tabLabelElement);
        this.titleElement = apogeeui.createElementWithClass("div","visiui_tf_tab_title",this.tabLabelElement);
        
        this.closeButton = apogeeui.createElementWithClass("img","visiui_tf_tab_cmd_button",this.tabLabelElement);
        this.closeButton.src = apogeeui.getResourcePath(apogeeui.CLOSE_CMD_IMAGE);
        
        this.closeButton.onclick = () => {
            this.close();
        };
        
        //create the tab element
        this.displayFrame = apogeeui.createElementWithClass("div","visiui-tf-tab-window");
        this.tabInsideContainer = new DisplayAndHeader(DisplayAndHeader.FIXED_PANE,
                null,
                DisplayAndHeader.FIXED_PANE,
                null
            );
        this.displayFrame.appendChild(this.tabInsideContainer.getOuterElement());
        
        this.headerContainer = this.tabInsideContainer.getHeaderContainer();
        this.bodyContainer = this.tabInsideContainer.getBodyContainer();
        
        this.isShowing = false;
    }

    //---------------------------
    // WINDOW CONTAINER
    //---------------------------

    /** This is called by the tab frame. */
    setTabFrame(tabFrame) {
        this.tabFrame = tabFrame;
        var instance = this;
        //attach to listeners to forward show and hide events
        this.tabShownListener = (tab) => {
            if(tab == instance) {
                this.isShowing = true;
                instance.dispatchEvent(apogeeui.SHOWN_EVENT,instance);
            }
        };
        this.tabFrame.addListener(apogeeui.SHOWN_EVENT, this.tabShownListener);
        this.tabHiddenListener = (tab) => {
            if(tab == instance) {
                this.isShowing = false;
                instance.dispatchEvent(apogeeui.HIDDEN_EVENT,instance);
            }
        };
        this.tabFrame.addListener(apogeeui.HIDDEN_EVENT, this.tabHiddenListener);
    }

    /** This sets the tab as the active tab. It returns true if it can do this. In the case
     * it does not have an active frame, it returns false. */
    makeActive() {
        if(this.tabFrame) {
            this.tabFrame.setActiveTab(this.id);
            return true;
        }
        else {
            return false;
        }
    }

    /** This method must be implemented in inheriting objects. */
    getId() {
        return this.id;
    }

    /** This returns true if the tab is showing in the display. */
    getIsShowing() {
        return this.isShowing;
    }

    /** This method must be implemented in inheriting objects. */
    setTitle(title) {
        this.titleElement.innerHTML = title;
        this.title = title;
    }

    /** This sets the content for the window. If null (or otherwise false) is passed
     * the content will be set to empty.*/
    setHeaderContent(contentElement) {
        apogeeui.removeAllChildren(this.headerContainer);
        if(contentElement) {
            this.headerContainer.appendChild(contentElement);
        }
    }

    /** This sets the content for the window. The content type
     *  can be:
     *  apogeeui.RESIZABLE - content can be resized to fit window - scrolling, if necessary is managed within the content element.
     *  apogeeui.FIXED_SIZE - the content is fixed size. The window will decide how to display the complete object.*/
    setContent(contentElement,elementType) {
        if(!this.contentContainer) {
            this.contentContainer = apogeeui.createElement("div");
            apogeeui.removeAllChildren(this.bodyContainer);
            this.bodyContainer.appendChild(this.contentContainer);
        }
        if(elementType == apogeeui.RESIZABLE) {
            this.contentContainer.className = "visiui_tf_tab_contents_fixed";
        }
        else if(elementType == apogeeui.FIXED_SIZE) {
            this.contentContainer.className = "visiui_tf_tab_contents_scrolling";
        }
        else {
            throw new Error("Unknown content type: " + elementType);
        }
        
        apogeeui.removeAllChildren(this.contentContainer);
        this.contentContainer.appendChild(contentElement);
        
        this.content = contentElement;
    }

    /** This method must be implemented in inheriting objects. */
    getTitle() {
        return this.title;
    }

    /** This method shows the window. */
    createMenu(iconUrl) {
        if(!iconUrl) iconUrl = apogeeui.getResourcePath(apogeeui.MENU_IMAGE);
        this.menu = Menu.createMenuFromImage(iconUrl);
        this.menuContainer.appendChild(this.menu.domElement);
        //add the icon overlay element
        this.iconOverlayElement = apogeeui.createElementWithClass("div","visiui_tf_icon_overlay",this.menuContainer);
        return this.menu;
    }

    /** This method shows the window. */
    getMenu() {
        return this.menu;
    }

    /** This sets the given element as the icon overlay. If null or other [false} is passed
     * this will just clear the icon overlay. */
    setIconOverlay(element) {
        if(this.iconOverlayElement) {
            this.clearIconOverlay();
            if(element) {
                this.iconOverlayElement.appendChild(element);
            }
        }
    }

    clearIconOverlay() {
        if(this.iconOverlayElement) {
            apogeeui.removeAllChildren(this.iconOverlayElement);
        }
    }

    /** This method closes the window. */
    close(forceClose) {
        if(!this.tabFrame) return;
        
        if(!forceClose) {
            //make a close request
            var requestResponse = this.callHandler(apogeeui.REQUEST_CLOSE,this);
            if(requestResponse == apogeeui.DENY_CLOSE) {
                //do not close the window
                return;
            }
        }
        
        this.tabFrame.closeTab(this.id);
        this.tabFrame.removeListener(apogeeui.SHOWN_EVENT, this.tabShownListener);
        this.tabFrame.removeListener(apogeeui.HIDDEN_EVENT, this.tabHiddenListener);
        this.tabFrame = null;
        
        this.dispatchEvent(apogeeui.CLOSE_EVENT,this);
        
        
    }

    //---------------------------
    // GUI ELEMENT
    //---------------------------

    /** This method must be implemented in inheriting objects. */
    getMainElement() {
        return this.displayFrame;
    }

    /** This method must be implemented in inheriting objects. */
    getLabelElement() {
        return this.tabLabelElement;
    }

}

