import ReferenceEntry from "/apogeejs-app-lib/src/references/ReferenceEntry.js";
import {getLinkLoader} from "/apogeejs-app-lib/src/references/LinkLoader.js";

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
export default class JsScriptEntry extends ReferenceEntry {
    
    constructor(referenceList,referenceData) {
        super(referenceList,referenceData,JsScriptEntry.REFERENCE_TYPE_INFO);

    }

    /** This method loads the actual link. */
    implementationLoadEntry(onLoad,onError) {
        this.linkCallerId = getLinkLoader().createLinkCallerId();
        getLinkLoader().addLinkElement("script",this.getUrl(),this.getId(),onLoad,onError);
    }
    
    /** This method removes the link. */
    removeEntry() {
        getLinkLoader().removeLinkElement("script",this.getUrl(),this.getId());
        return true;
    }
    
    _getLinkCallerHandle() {
        return "JsScriptEntry-" + this.getId();
    }
}

JsScriptEntry.REFERENCE_TYPE = "js link";


