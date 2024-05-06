import { LightningElement, track,api} from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getFileVersions from "@salesforce/apex/SurveyorPortalController.getVersionFiles";
export default class Evaporators extends LightningElement {

    @api type;
    relatedRecordBool = true;
    currentPageReference;
    loaded = false;
    @track selectedSectionCount = '';
    @track sections = [];
    loaded = false;
    @track fileList;
    @track files = [];
    @api surveyRecord ;
    fileName ;
    listFileName = [];
    isImageLoading = false;

    @api count;

    column1Labels = [
        'Photos of Top of Walk in Box',
        'Photos of the Existing Gridpoint System Inside the Cooler/Freezer',
        'Photo of Modular Alarm on Door Showing Freezer Temp',
        'Photos of All Dial Thermometers Showing Temperatures',
        'Photo of Temperature Inside Cooler/Freezer (F) to be Measured Independently of Walk in Temp Sensors',
        'Photo of Data Tags on Both Cooler Evaps',
        'Photo of Data Tag on Freezer Evap Coils',
        'Photo of Evap Coils in Cooler & Freezer',
        'Photos of Drains in Cooler & Freezer',
        'Photos of Floor in Cooler & Freezer',
        'Photos of Main Doors in Cooler & Freezer with Door Closed'
    ];

    @track sufixName = [
        'TopWalkBox',
        'GridpointCooler',
        'ModularAlarmTemp',
        'dialThermometers',
        'IdependentlySensors',
        'DataTagCoolerEvaps',
        'DataTagFreezerEvaps',
        'EvapCoilsCooler&Freezer',
        'DrainsCooler&Freezer',
        'FloorCooler&Freezer',
        'Cooler&FrzeerDoorClosed'
    ];
   

    connectedCallback(){
        this.generateSections();
        this.loadFileVersions();
    }

    generateSections() {
        this.sections = [];
        let section = { key: 1, label: 'Evaporators '+this.count, rows: [] };
        for (let j = 1; j <= 10; j++) {
            let row = { key: j, columns: [] };
            for (let k = 1; k <= 3; k++) {
                if (k === 1) {
                    row.columns.push({ key: k, label: this.column1Labels[j - 1], isInput: true, sufix: this.type + this.sufixName[j - 1] + ':' + 'EV-' +this.count});
                } else if (k === 2) {
                    row.columns.push({ key: k, label: 'File Upload ' + k, isFileUpload: true, sufix: this.type + this.sufixName[j - 1] + ':' + 'EV-' +this.count + 'RecordId:' + this.surveyRecord });
                } else {
                    row.columns.push({ key: k, label: 'Display Photos ' + k, isDisplayPhotos: true, photos: [] });
                }
            }
            section.rows.push(row);
        }
        this.sections.push(section);
    }
   

    handleUploadFinished(event) {
        const uploadedFiles = event.detail.files;
        uploadedFiles.forEach(file => {
            this.fileName = file.name.split('.').slice(0, -1).join('.');
            let sufix = event.target.dataset.sufix;
            if (sufix.includes('RecordId')) {
                sufix = sufix.split('RecordId')[0];
                this.fileName += '_' + sufix;
                console.log('File Name 71', this.fileName);
            } else {
                this.fileName += '_' + sufix;
                console.log('File Name 74', this.fileName);
            }
            this.listFileName.push(this.fileName); // Corrected the method name from `pust` to `push`
        });
        let noOfFiles = uploadedFiles.length;
        console.log('No. of files uploaded', noOfFiles);
        console.log('-------file details---' + JSON.stringify(uploadedFiles));
        this.loadFileVersions();
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'File(s) Download',
                message: noOfFiles + ' File(s) Uploaded Successfully!!!',
                variant: 'success'
            }),
        );
    }

    loadFileVersions() {
        this.isImageLoading = true;
        console.log('Survey Record Id 100 ', this.surveyRecord);
        getFileVersions({ recordId: this.surveyRecord })
            .then((result) => {
                this.isImageLoading = false;
                if (result && result.length > 0) {
                    this.fileList = result;
                    this.files = result.map(fileData => {
                        console.log('Title:', fileData.Title);
                        console.log('Extension:', fileData.FileExtension);

                        return {
                            Id: fileData.Id,
                            Title: fileData.Title,
                            Extension: fileData.FileExtension,
                            ContentDocumentId: fileData.ContentDocumentId,
                            ContentDocument: fileData.ContentDocument,
                            CreatedDate: fileData.CreatedDate,
                            thumbnailFileCard: "/survey/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=" + fileData.Id + "&operationContext=CHATTER&contentId=" + fileData.ContentDocumentId,
                            downloadUrl: "/survey/sfc/servlet.shepherd/document/download/" + fileData.ContentDocumentId
                        };
                    });
                    // Process file versions and update sections
                    this.processFileVersions(this.files);
                    this.loaded = true;
                } else {
                   // this.showToast('error', 'Error', 'No file versions found.');
                }
            })
            .catch((error) => {
                //console.error('Error fetching file versions:', error);
                //this.showToast('error', 'Error', 'Error fetching file versions: ' + error.body.message);
            });
    }

    processFileVersions(fileVersions) {
        this.sections.forEach((section) => {
            section.rows.forEach((row) => {
                const rowFilesData = [];
                row.columns.forEach((column) => {
                    const matchingFiles = fileVersions.filter((file) => file.Title.includes(column.sufix));
                    console.log('Matching Files ', JSON.stringify(matchingFiles));
                    const filteredFiles = matchingFiles.filter((file) => !file.Title.includes('undefined'));
                    console.log('filtered Files ', JSON.stringify(filteredFiles));
                    if (filteredFiles.length > 0) {
                        rowFilesData.push(...matchingFiles);
                    }
                });
                row.filesData = rowFilesData;
            });
        });
    }

    showToast(variant, title, message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant,
            })
        );
    }

}