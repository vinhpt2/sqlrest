if (!kp) var kp = {};
if (!kp.awt) kp.awt = {};

//AWSnap - Công cụ bắt dính
kp.awt.AWSnap = (function () {
    var that;

    function AWSnap(conf, id) {
        that = this;
        this._conf = conf;
        this.iconClass = "awsnap-png";
        this.title = "AWSnap Tools";

        $(id).w2toolbar({
            name: "tbrSnap",
            items: [
                { type: "drop", text: "Snap", html: "<fieldset style='margin:7px;padding:5px'><legend>&nbspSetting&nbsp</legend><table><tr><td>Tolerence&nbsp</td><td><input type='number' style='width:100px'/></td></tr><tr><td>Activate</td><td><select style='width:100px'><option value='A'>Always</option><option value='C'>Pressing [Ctrl]</option></select></td></tr><tr><td>Style</td><td><select style='width:100px'><option value='C'>Circle</option><option value='S'>Square</option></select></td></tr><tr><td>Color</td><td><select style='width:100px'><option value='R'>Red</option><option value='G'>Green</option></select></td></tr></table></fieldset>" },
                { type: "html", id: "chkSnapEnable", html: "<input type='checkbox'/ title='Enable Spapping'>"},
                { type: "break" },
                { type: "check", id: "cmdSnapPoint", icon: "snappoint-png", tooltip: "Snap to point" },
                { type: "check", id: "cmdSnapVertex", icon: "snapvertex-png", tooltip: "Snap to vertex" },
                { type: "check", id: "cmdSnapEdge", icon: "snapedge-png", tooltip: "Snap to edge" }
            ]
        });
    }

    //end of contructor
    return AWSnap;
} ());