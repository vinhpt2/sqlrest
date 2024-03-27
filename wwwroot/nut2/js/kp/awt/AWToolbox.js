if (!kp) var kp = {};
if (!kp.awt) kp.awt = {};

//AWToolbox - Hộp công cụ AWT
kp.awt.AWToolbox = (function () {
    var that;

    function AWToolbox(conf, domNode) {
        that = this;
        this._conf = conf;
        this.divs = [];

        this.domNode = domNode;
        domNode.style.display = "flex";

        var divAWX = document.createElement("div");
        domNode.appendChild(divAWX);

        this.divToolbox = document.createElement("div");
        domNode.appendChild(this.divToolbox);

        this.awx = $(divAWX).w2toolbar({
            name: "tbrToolbox",
            items: [
                { type: "button", id: "cmdToolbox", icon: "awtoolbox-png", tooltip: "AWToolbox" },
                { type: "menu", id: "mnuToolbox", items: [] }
            ],
            onClick: this.tool_onClick
        });
    }

    AWToolbox.prototype.tool_onClick = function (evt) {
        if (evt.subItem) {
            var div = that.divs[evt.subItem.id]
            div.style.display = div.style.display ? "" : "none";
        } else {
            if (evt.item.id == "cmdToolbox") {
                w2popup.open({
                    title: "<img src='kp/awt/css/awtoolbox.png'/>&nbsp;About",
                    width: 580,
                    buttons: "<button class='w2ui-btn' onclick='w2popup.close()'>OK</button>",
                    body: "<table><tr><td rowspan='9' style='text-align:center'><a href='http://greencompa.com' target='_blank'><img src='kp/awt/css/logo96.png'/><br /><i>http://greencompa.com</i></a></td><td><h3 style='background-color:lime'>&nbsp;<a href='http://greencompa.com/ce' target='_blank'>green COMPA</a><i><sup> ce.3o</sup> - v1.0.β</i></h3></td></tr><tr><td><hr/></td></tr><tr><td><b>COMplete & Professional Assisted Editor<i> for OpenLayers 3.x</i></b></td></tr><tr><td><b>ce - <i>Comunity Edition version 1.0.β</i></b></td></tr><tr><td>AGPLv2 - <i> Affero General Public License v2</i></td></tr><tr><td>2018 Copyright© - <i>Phạm Thế Vinh. All rights reserved.</i></td></tr><tr><td><hr/></td></tr><tr><td>Email: <i><a style='color:lime' href='mailto:vinhptfpt@gmail.com' target='_blank'>vinhptfpt@gmail.com</i></td></tr><tr><td>Edition <b>green COMPA<i><sup> Pro.3x</sup> - <a href='http://greencompa.com/pro' target='_blank'>http://greencompa.com/pro</a></i></b></td></tr></table>"
                });
            }
        }
    }

    AWToolbox.prototype.loadAWWidget = function (widgetClass, visible) {
        var div = document.createElement("div");
        this.divToolbox.appendChild(div);

        var widget = new widgetClass(this._conf, div);
        if (!visible)
            div.style.display = "none";
        this.divs[widgetClass.name] = div;
        this.awx.get("mnuToolbox").items.push({ text: " ", id: widgetClass.name, icon: widget.iconClass, tooltip: widget.title });
		return widget;
    }

    AWToolbox.prototype.displayToolbox = function (hidden) {
        this.domNode.style.display = hidden ? "none" : "flex";
    }

    //end of contructor
    return AWToolbox;
} ());