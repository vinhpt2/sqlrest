//awt2 - Thư viện dùng chung
if (!kp) var kp = {};
if (!kp.awt) kp.awt = {};

kp.awt.URL_WEBSITE = "http://compa.awetool.com";
kp.awt.URL_ARCGISONLINE_GEOMETRY_SERVICE = "https://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer";
kp.awt.MAX_SELECT_FEATURE = 200;
kp.awt.MAX_QUERY_FEATURE = 1000;
kp.awt.TRANSPARENT_DYNAMICLAYER = 0.5;
kp.awt.TOLERANCE = 2;//Đơn vị là pixel
kp.awt.PRINT_TEMPLATES = [
    { name: "landscape-a4", url: "kp/awt/prints/landscape-a4.html" },
    { name: "potrait-a4", url: "kp/awt/prints/potrait-a4.html" }
]

kp.awt.BASEMAPS = {
    osm: new ol.source.OSM(),
    streets: new ol.source.XYZ({ url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}" }),
    imagery: new ol.source.XYZ({ url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" }),
    topo: new ol.source.XYZ({ url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}" }),
    relief: new ol.source.XYZ({ url: "https://server.arcgisonline.com/arcgis/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}" }),
    light_gray: new ol.source.XYZ({ url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}" }),
    dark_gray: new ol.source.XYZ({ url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}" }),
    oceans: new ol.source.XYZ({ url: "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}" }),
    national_geographic: new ol.source.XYZ({ url: "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}" })
}

//Hàm toàn cục

kp.awt.SYMB_HIGHLIGHT = {//Symbol dùng khi highlight
    image: null,
    stroke: null,
    fill: null
}

kp.awt.SYMB_SELECT = {//Symbol dùng khi select
    image: null,
    stroke: null,
    fill: null
}


kp.awt.SYMB_EDITSELECT = {//Symbol dùng khi edit-select
    image: null,
    stroke: null,
    fill: null
}

kp.awt.SYMB_EDITVERTEX = {//Symbol dùng khi edit-vertex
    image: null,
    stroke: null,
    fill: null
}

kp.awt.SYMB_HELPER = {//Symbol của các đối tượng helper
    image: null,
    stroke: null,
    fill: null
}

kp.awt.calculateGeometryMsg = function (geometry, unit) {
    var msg
    switch (geometry.getType()) {
        case "Point":
            msg = "x=" + geometry.getCoordinates()[0].toFixed(3) + ", y=" + geometry.getCoordinates()[1].toFixed(3);
            break;
        case "LineString":
            var length = ol.proj.Units.METERS_PER_UNIT[unit] * geometry.getLength();
            msg = "length=" + (length < 1000 ? length.toFixed(2) + "m" : (length / 1000).toFixed(2) + "km");
            break;
        case "Polygon":
            var area = ol.proj.Units.METERS_PER_UNIT[unit] * ol.proj.Units.METERS_PER_UNIT[unit] * geometry.getArea();
            msg = "area=" + (area < 1000000 ? area.toFixed(2) + "m²" : (area / 1000000).toFixed(2) + "km²");
            break;
    }
    return msg;
}


kp.awt.showInput = function (title, input, okCallback) {
    var dlg = new dijit.Dialog({
        title: title,
        content: input,
        actionBarTemplate: "<div class='dijitDialogPaneActionBar' data-dojo-attach-point='actionBarNode'><button data-dojo-type='dijit/form/Button' data-dojo-attach-point='butOk'>Ok</button><button data-dojo-type='dijit/form/Button' data-dojo-attach-point='butCancel'>Cancel</button></div>"
    });

    dlg.butOk.addEventListener("click", function () { dlg.hide() });
    if (okCallback) dlg.butOk.addEventListener("click", okCallback);
    dlg.butCancel.addEventListener("click", function () { dlg.hide() });
    dlg.show();
}

kp.awt.showNotify = function (msg, seconds) {
    var dlg = new dijit.Dialog({
        title: "Notification",
        content: "<table valign='center'><tr><td><img src='kp/awt/css/notify32.png'/></td><td>&nbsp;</td><td>" + msg + "</td></tr></table>"
    });
    dlg.show();
    setTimeout(function () {
        dlg.hide();
    }, seconds ? 1000 * seconds : 1000);
}

kp.awt.showConfirm = function (msg, yesCallback, noCallback, hasCancel) {
    var dlg = new dijit.Dialog({
        title: "Confirm",
        content: "<table valign='center'><tr><td><img src='kp/awt/css/confirm32.png'/></td><td>&nbsp;</td><td>" + msg + "</td></tr></table>",
        actionBarTemplate: hasCancel ? "<div class='dijitDialogPaneActionBar' data-dojo-attach-point='actionBarNode'><button data-dojo-type='dijit/form/Button' data-dojo-attach-point='butYes'>Yes</button><button data-dojo-type='dijit/form/Button' data-dojo-attach-point='butNo'>No</button><button data-dojo-type='dijit/form/Button' data-dojo-attach-point='butCancel'>Cancel</button></div>" : "<div class='dijitDialogPaneActionBar' data-dojo-attach-point='actionBarNode'><button data-dojo-type='dijit/form/Button' data-dojo-attach-point='butYes'>Yes</button><button data-dojo-type='dijit/form/Button' data-dojo-attach-point='butNo'>No</button></div>"
    });

    dlg.butYes.addEventListener("click", function () { dlg.hide() });
    if (yesCallback) dlg.butYes.addEventListener("click", yesCallback);
    dlg.butNo.addEventListener("click", function () { dlg.hide() });
    if (noCallback) dlg.butNo.addEventListener("click", noCallback);
    if (hasCancel)
        dlg.butCancel.addEventListener("click", function () { dlg.hide() });
    dlg.show();
}

kp.awt.showInfor = function (msg, callback) {
    var dlg = new dijit.Dialog({
        title: "Information",
        content: "<table valign='center'><tr><td><img src='kp/awt/css/infor32.png'/></td><td>&nbsp;</td><td>" + msg + "</td></tr></table>",
        actionBarTemplate: "<div class='dijitDialogPaneActionBar' data-dojo-attach-point='actionBarNode'><button data-dojo-type='dijit/form/Button' data-dojo-attach-point='butOk'>Ok</button></div>"
    });

    dlg.butOk.addEventListener("click", function () { dlg.hide() });
    if (callback) dlg.butYes.addEventListener("click", callback);
    dlg.show();
}

kp.awt.showError = function (err, callback) {
    w2alert(err).ok(callback);
}

kp.awt.showWarning = function (msg, callback) {
    var dlg = new dijit.Dialog({
        title: "Warning",
        content: "<table valign='center'><tr><td><img src='kp/awt/css/warning32.png'/></td><td>&nbsp;</td><td>" + msg + "</td></tr></table>",
        actionBarTemplate: "<div class='dijitDialogPaneActionBar' data-dojo-attach-point='actionBarNode'><button data-dojo-type='dijit/form/Button' data-dojo-attach-point='butOk'>Ok</button></div>"
    });

    dlg.butOk.addEventListener("click", function () { dlg.hide() });
    if (callback) dlg.butYes.addEventListener("click", callback);
    dlg.show();
}

kp.awt.createDialog=function(name,title,width,height){
	var div=document.createElement("div");
	div.id=name;
	div.className="aw-dlg";
	div.style.display="none";
	div.innerHTML='<div class="aw-dlg-title" style="width:'+width+'px"><span style="float:left;cursor:pointer" onclick="this.checked=!this.checked;this.innerHTML=this.checked?\'▢\':\'─\';'+name+'Content.style.height=this.checked?\'0px\':\''+width+'px\'">─</span><i id="'+name+'Title">'+title+'</i><span style="float:right;cursor:pointer" onclick="'+name+'.style.display=\'none\'">⛌</span></div><div id="'+name+'Content" class="aw-dlg-content" style="width:'+width+'px;height:'+height+'px">';
	return div;
}





