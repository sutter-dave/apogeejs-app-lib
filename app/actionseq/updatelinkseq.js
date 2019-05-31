apogeeapp.app.updatelinkseq = {};

apogeeapp.app.updatelinkseq.DIALOG_LAYOUT_URL_LINE = {
    "type": "inputElement",
    "heading": "URL: ",
    "resultKey": "url",
    "initial": ""
};
apogeeapp.app.updatelinkseq.DIALOG_LAYOUT_NICKNAME_LINE = {
    "type": "inputElement",
    "heading": "Nickname (optional): ",
    "resultKey": "nickname",
    "initial": ""
};
apogeeapp.app.updatelinkseq.DIALOG_LAYOUT_SUBMIT_LINE = {
    "type": "submit",
    "submit": "Update",
    "cancel": "Cancel"
}

//=====================================
// UI Entry Point
//=====================================

/** This method gets a callback to update the properties of a workspace. */
apogeeapp.app.updatelinkseq.addLink = function(referenceManager,entryTypeInfo) {
        
    //create the dialog layout 
    var titleLine = {};
    titleLine.type = "title";
    titleLine.title = entryTypeInfo.ADD_ENTRY_TEXT

    var dialogLayout = {};
    dialogLayout.lines = [];
    dialogLayout.lines.push(titleLine);
    dialogLayout.lines.push(apogeeapp.app.updatelinkseq.DIALOG_LAYOUT_URL_LINE);
    dialogLayout.lines.push(apogeeapp.app.updatelinkseq.DIALOG_LAYOUT_NICKNAME_LINE);
    dialogLayout.lines.push(apogeeapp.app.updatelinkseq.DIALOG_LAYOUT_SUBMIT_LINE);

    //create on submit callback
    var onSubmitFunction = function(newValues) {

        //validate url- for now just make sure it is not zero length
        if((!newValues.url)||(newValues.url.length === 0)) {
            alert("The url must not be empty");
            return false;
        }

        //not sure what to do with promise
        var entryJson = {};
        entryJson.url = newValues.url;
        entryJson.nickname = newValues.nickname;
        entryJson.entryType = entryTypeInfo.REFERENCE_TYPE;

        //run command
        var command = apogeeapp.app.updatelink.createAddEntryCommand(referenceManager,entryJson);
        apogeeapp.app.Apogee.getInstance().executeCommand(command);

        //return true to close the dialog
        return true;
    }

    //show dialog
    apogeeapp.app.dialog.showConfigurableDialog(dialogLayout,onSubmitFunction);
}

/** This method gets a callback to update the properties of a workspace. */
apogeeapp.app.updatelinkseq.updateLink = function(referenceEntry) {
        
    var initialValues = {};
    initialValues.url = referenceEntry.getUrl();
    initialValues.nickname = referenceEntry.getNickname();
    if(initialValues.nickname == initialValues.url) initialValues.nickname = "";

    var entryTypeInfo = referenceEntry.getTypeInfo();

    //create the dialog layout
    var titleLine = {};
    titleLine.type = "title";
    titleLine.title = entryTypeInfo.UPDATE_ENTRY_TEXT;

    var urlLine = apogee.util.jsonCopy(apogeeapp.app.updatelinkseq.DIALOG_LAYOUT_URL_LINE);
    urlLine.initial = initialValues.url;
    var nicknameLine = apogee.util.jsonCopy(apogeeapp.app.updatelinkseq.DIALOG_LAYOUT_NICKNAME_LINE);
    nicknameLine.initial = initialValues.nickname;

    var dialogLayout = {};
    dialogLayout.lines = [];
    dialogLayout.lines.push(titleLine);
    dialogLayout.lines.push(urlLine);
    dialogLayout.lines.push(nicknameLine);
    dialogLayout.lines.push(apogeeapp.app.updatelinkseq.DIALOG_LAYOUT_SUBMIT_LINE);

    //create on submit callback
    var onSubmitFunction = function(newValues) {

        //validate url- for now just make sure it is not zero length
        if((!newValues.url)||(newValues.url.length === 0)) {
            alert("The url must not be empty");
            return false;
        }

        //run command
        var command = apogeeapp.app.updatelink.createUpdateEntryCommand(referenceEntry,newValues.url,newValues.nickname);
        apogeeapp.app.Apogee.getInstance().executeCommand(command);

        //return true to close the dialog
        return true;
    }

    //show dialog
    apogeeapp.app.dialog.showConfigurableDialog(dialogLayout,onSubmitFunction);
}


/** This method gets a callback to update the properties of a workspace. */
apogeeapp.app.updatelinkseq.removeLink = function(referenceEntry) {

    var doDelete= confirm("Are you sure you want to delete this link?");

    //create on submit callback
    if(doDelete) {

        //run command
        var command = apogeeapp.app.updatelink.createRemoveEntryCommand(referenceEntry);
        apogeeapp.app.Apogee.getInstance().executeCommand(command);
    }
}









