if (!kp) var kp = {};
if (!kp.awt) kp.awt = {};

//Editor - Thư viện edit
kp.awt.Editor = (function () {
    //enum of edit-action
    var ACTION_INSERT = 1, ACTION_UPDATE = 2, ACTION_DELETE = 3, ACTION_NONE = 4;
    var that;

    //conf={ map, dynamicLayer, graphicLayer, graphicLayerDraw, graphicLayerSketch, geometryService, edit, draw}
    function Editor(conf) {
        that = this;
        this._conf = conf;

        this.editLayer = new ol.layer.Vector({
            //map: conf.map,
            source: new ol.source.Vector(),
            style: new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 3,
                    fill: new ol.style.Fill({ color: "black" })
                }),
                fill: new ol.style.Fill({ color: [0, 0, 0, 0] }),
                stroke: new ol.style.Stroke({ color: "black", width: 1 })
            })
        });
		this.editLayer.name="Editing layer";
		conf.map.addLayer(this.editLayer);
		this.undos = [];
        this.redos = [];
		this.isEditing = false;
    }

    Editor.prototype.eventUseEdit = function (action) { /*event handler*/ }

    Editor.prototype.begin = function (features) {
        if (features) {
            this.editLayer.getSource().addFeatures(features);
        }
    }

    Editor.prototype.end = function () {
        this._conf.map.removeLayer(this.editLayer);
        
        //this._conf.edit.deactivate()
        this.eventUseEdit(kp.awt.Editor.EDIT_END);
        this.isEditing = false;
    }

	Editor.prototype.isDirty = function () {
        return (this.undos.length > 0);
    }
	
	Editor.prototype.applyEdits = function () {
        if (this.undos.length > 0) {
            var inserts = [], updates = [], deletes = [];
            var inserted = [], updated = [], deleted = [];
            var features = [];
            for (var i = 0; i < this.layers.length; i++) {
                inserts[i] = [];
                updates[i] = [];
                deletes[i] = [];
                inserted[i] = {};
                updated[i] = {};
                deleted[i] = {};
                features[i] = {}
            }

            var feat, action, oid, id;
            for (var i = 0; i < this.undos.length; i++) {
                action = this.undos[i].action;
                for (var j = 0; j < this.undos[i].features.length; j++) {
                    feat = this.undos[i].features[j];
                    oid = feat.attributes[feat._layer.objectIdField];
                    id = feat._layer.layerId;
                    if (!features[id][oid])
                        features[id][oid] = feat;
                    if (action == ACTION_INSERT)
                        inserted[id][oid] = true;
                    else if (action == ACTION_UPDATE)
                        updated[id][oid] = true;
                    else if (action == ACTION_DELETE)
                        deleted[id][oid] = true;
                }
            }

            for (id = 0; id < features.length; id++) {
                for (var oid in features[id]) {
                    if (features[id].hasOwnProperty(oid)) {
                        feat = features[id][oid];
                        if (inserted[id][oid] && !deleted[id][oid]) {
                            feat.attributes.ACT = ACTION_INSERT;
                            inserts[id].push(feat);
                        } else if (deleted[id][oid] && !inserted[id][oid]) {
                            feat.attributes.ACT = ACTION_DELETE;
                            deletes[id].push(feat);
                        } else if (updated[id][oid] && !inserted[id][oid] && !deleted[id][oid]) {
                            if (feat.attributes.ACT != ACTION_INSERT && feat.attributes.ACT != ACTION_DELETE)
                                feat.attributes.ACT = ACTION_UPDATE;
                            updates[id].push(feat);
                        }
                    }
                }
            }

            for (id = 0; id < this.layers.length; id++) {
                if (inserts[id].length > 0 || updates[id].length > 0 || deletes[id].length > 0) {
                    this.layers[id].applyEdits(inserts[id], updates[id], deletes[id], this._onEditsComplete, this._errorHandler);
                }
            }

            that.redos = [];
            that.undos = [];
            this.eventUseEdit(vh.awt.Editor.EDIT_CLEAN);
        }
    }
	
    //end of contructor
    return Editor;
} ());

//enum of edit-status
kp.awt.Editor.EDIT_BEGIN = 1; kp.awt.Editor.EDIT_SELECT = 2; kp.awt.Editor.EDIT_ACTIVEMRS = 3; kp.awt.Editor.EDIT_ACTIVEVERTICES = 4; kp.awt.Editor.EDIT_NOSELECT = 5; kp.awt.Editor.EDIT_DIRTY = 6; kp.awt.Editor.EDIT_CLEAN = 7; kp.awt.Editor.EDIT_DOUNDO = 8; kp.awt.Editor.EDIT_END = 9; kp.awt.Editor.EDIT_LASTUNDO = 10; kp.awt.Editor.EDIT_LASTREDO = 11;
