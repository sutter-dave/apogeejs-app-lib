import {bannerConstants} from "/apogeeview/componentdisplay/banner.js"; 
import EventManager from "/apogeeutil/EventManagerClass.js";

/** This class manages references for the web page.*/
export default class ReferenceEntry extends EventManager {
    
    constructor(referenceList,referenceData,referenceType) {
        super();

        this.id = ReferenceEntry._createId();
        this.referenceList = referenceList;
        this.clearUpdated();

        this.url = referenceData.url;
        this.referenceType = referenceType;

        //we create in a pending state because the link is not loaded.
        this.state = bannerConstants.BANNER_TYPE_PENDING;

        var nickname = referenceData.nickname;
        if((!nickname)||(nickname.length === 0)) nickname = this.createEntryNameFromUrl(this.url);
        this.nickname = nickname;  
        
        this.fieldUpdated("url");
        this.fieldUpdated("nickname");
        this.fieldUpdated("state");     
    }

    //---------------------------
    // references entry interface
    //---------------------------
    
    getReferenceManager() {
        return this.referenceManager;
    }

    getReferenceList() {
        return this.referenceList;
    }

    getId() {
        return this.id;
    }
    
    getEntryType() {
        return this.referenceType;
    }

    getState() {
        return this.state;
    }

    getUrl() {
        return this.url;
    }

    getNickname() {
        return this.nickname;
    }

    ///////////////////////////////////////////////////////////////////////////

    /** This method loads the link onto the page. It returns a promise that
     * resolves when the reference is loaded.
     * The promise returns a commandResult for the loaded reference. */
    //loadEntry()
    
    /** This method removes the reference. It returns a command result for the removed link. */
    //remove()
    
    
    ///////////////////////////////////////////////////////////////////////////

    /** This method loads the link onto the page. It returns a promise that
     * resolves when the link is loaded. */
    saveEntry() {
        var entryJson = {};
        entryJson.url = this.url;
        if(this.nickname != this.url) entryJson.nickname = this.nickname;
        entryJson.entryType = this.referenceType;
        return entryJson;
    }

    //-------------------------
    // Entry specific management methods
    //-------------------------

    /** This method removes and reloads the link, returning a promise. */
    updateData(url,nickname) {

        //update nickname
        if(this.treeEntry) {
            if((!nickname)||(nickname.length === 0)) nickname = this.createEntryNameFromUrl(url);
            if(this.nickname != nickname) {
                this.nickname = nickname;
                this.treeEntry.setLabel(this.nickname);
                this.fieldUpdated("nickname");
            }
        }

        //update url
        if(this.url != url) {
            this.url = url;
            this.remove();
            var promise = this.loadEntry();
            this.fieldUpdated("url");
        }

        //if we didn't do a URL update, make a promise that says update was successful
        if(!promise) promise = Promise.resolve({
            cmdDone: true,
            target: this,
            action: "updated"
        });

        return promise;
    }

    //------------------------------------------
    // Event Tracking Methods
    //------------------------------------------

    getUpdated() {
        return this.updated;
    }

    clearUpdated() {
        this.updated = {};
    }

    fieldUpdated(field) {
        this.updated[field] = true;
    }

    getEventId() {
        //use the main member for the event ID
        return "link-" + this.id;
    }


    //===================================
    // private methods
    //===================================

    createEntryNameFromUrl(url) {
        return url;
    }

    getElementId() {
        return ReferenceEntry.ELEMENT_ID_BASE + this.id;
    }

    setClearState() {
        this.setState(bannerConstants.BANNER_TYPE_NONE);
    }

    setError(errorMsg) {
        this.setState(bannerConstants.BANNER_TYPE_ERROR,errorMsg);
    }

    setPendingState() {
        this.setState(bannerConstants.BANNER_TYPE_PENDING,"loading");
    }

    setState(state,msg) {
        if(this.state != state) {
            //for now we are not tracking msg. If we do, we should check for that change too
            this.state = state;
            this.fieldUpdated("state");
        }
    }

    /** This method generates a member ID for the member. It is only valid
     * for the duration the application is opened. It is not persisted.
     * @private
     */
    static _createId() {
        return nextId++;
    }

}

//====================================
// Static Fields
//====================================


ReferenceEntry.ELEMENT_ID_BASE = "__apogee_link_element_";

/** THis is used to give an id to the link entries 
 * @private */
let nextId = 1;

