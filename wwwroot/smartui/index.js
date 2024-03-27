import { NUT } from "./js/global.js";
import { NWindow } from "./js/window.js";
window.onload = function () {
	divMain.innerHTML = '<div id="divLogin" class="nut-center"></div>';
	NUT.toast = new Smart.Toast("#divToast", { autoClose: true });
	NUT.loading = new Smart.Toast("#divLoading", { itemClass:"blink", value: "Loading...", type: "time" });
	var frmLogin=new Smart.Form('#divLogin', {
		label: "🌰 Login",
		labelPosition: "top",
		value: localStorage.getItem(NUT.I_PASS) ? { username: atob(localStorage.getItem(NUT.I_USER)), password: atob(localStorage.getItem(NUT.I_PASS)), remember: true } : { username: atob(localStorage.getItem(NUT.I_USER)), password: "", remember: false },
		controls: [
			{
				dataField: 'username',
				label: '<b>Username</b>',
				required: true
			}, {
				dataField: 'password',
				controlType: 'password',
				label: '<b>Password</b>',
				required: true
			}, {
				dataField: 'remember',
				controlType: 'checkbox',
				label: 'Remember'
			}, {
				dataField: 'ok',
				controlType: 'button',
				label: '🗝️ Login',
				cssClass: 'primary'
			}
		]
	});
	frmLogin.ok.element.addEventListener('click', btnLogin_click);
}

function btnLogin_click () {
	NUT.loading.open();
	NUT.ds.select({ from: "v_user_site", where: [["username", "=", username.value], ["password", "=", password.value]] }, function (res) {
		if (res.success) {
			if (res.results.length == 1) {
				NUT.ctx.user = res.results[0];
				NUT.username = NUT.ctx.user.username;
				localStorage.setItem(NUT.I_USER, btoa(username.value));
				localStorage.setItem(NUT.I_PASS, password.value ? btoa(password.value) : "");

				var mnuMain = new Smart.Menu("#divMenu", {
					dataSource: [
						{ label: '<table><tr><td rowspan="2"><img src="site/' + NUT.ctx.user.siteid + '/logo.png"/></td><td><b>' + NUT.ctx.user.sitecode + '</b></td></tr><tr><td>' + NUT.ctx.user.sitename + '</td></tr></table>' },
						{
							label: '🧑<a class="nut-link">' + NUT.ctx.user.username + '</a>',
							items: [
								{ value: 'profile', label: 'Profile...' },
								{ value: 'changepass', label: 'Change password' },
								{ label: '--' },
								{ value: 'logout', label: 'Logout' }
							]
						},
					]
				});
				mnuMain.addEventListener('itemClick', mnuMain_click);

				//openDesktop;
				NUT.ds.select({ from: "v_access_app", orderby: "seqno", where: ["userid", "=", NUT.ctx.user.userid] }, function (res) {
					if (res.success) {
						var id = null;
						var appHtml = "<center class='nut-center'>";
						var toolHtml = "<center>";
						for (var i = 0; i < res.results.length; i++) {
							var data = res.results[i];
							if (data.appid != null) {
								if (id != data.appid) {
									id = data.appid;
									NUT.ctx.apps[id] = data;
									if (data.issystem) {
										toolHtml += "<div class='nut-tool' onclick='openApp(" + id + ")' title='" + data.description + "'><img src='site/" + data.siteid + "/" + id + "/icon.png'/></div>";
									} else {
										appHtml += "<div class='nut-tile' style='background:" + data.color + "' onclick='openApp(" + id + ")' title='" + data.description + "'><img src='site/" + data.siteid + "/" + id + "/icon.png'/>" + data.appname + "</div>";
									}
								}
							}
						};
						divMain.innerHTML = appHtml + "</center>";
						//divTool.innerHTML = toolHtml + "</center>";
						//if (res.length == 1) openApplication(id);
					} else NUT.toast.open("ERROR: " + res.results, 'red');
				});
				//renderMain();
			} else NUT.toast.open("Login fail for user " + username.value, 'warning');
		} else NUT.toast.open("ERROR: " + res.results, 'error');
		NUT.loading.closeAll();
	}, true);
}

function mnuMain_click(evt) {
	if (evt.target == "user:profile") {
		w2alert("<table><tr><td><b><i>Tài khoản:</i></b></td><td colspan='3'>" + NUT.ctx.user.username + "</td></tr><tr><td><b><i>Họ tên:</i></b></td><td colspan='3'>" + NUT.ctx.user.fullname + "</td></tr><tr><td><b><i>Điện thoại:</i></b></td><td>" + NUT.ctx.user.phone + "</td><td><b><i>Nhóm:</i></b></td><td>" + NUT.ctx.user.groupid + "</td></tr><tr><td><b><i>Trạng thái:</i></b></td><td>" + NUT.ctx.user.status + "</td><td><b><i>Ghi chú:</i></b></td><td>" + NUT.ctx.user.description + "</td></tr></table>", "<b>ℹ️ Information #<i>" + NUT.ctx.user.userid + "</i></b>");
	}
	else if (evt.target == "user:changepass") {
		w2popup.open({
			title: "🔑 <i>Change password</i>",
			speed: 0,
			width: 400,
			height: 210,
			body: "<table style='margin:auto'><tr><td>*Old password:</b></td><td><input id='txtUser_PasswordOld' type='password'/></td></tr><tr><td>*New password:</b></td><td><input id='txtUser_PasswordNew' type='password'/></td></tr><tr><td>*Re-type password:</b></td><td><input id='txtUser_PasswordNew2' type='password'/></td></tr></table>",
			buttons: '<button class="w2ui-btn" onclick="w2popup.close()">⛌ Close</button><button class="w2ui-btn" onclick="userChangePassword()">✔️ Ok</button>'
		});
	}
	else if (evt.target == "user:logout") {
		w2ui.layMain.hide("left");
		window.onload();
	}
}

window.openApp = function (idApp) {
	//load menu
	NUT.loading.open();
	NUT.ctx.curWinId = null;
	NUT.ctx.curApp = NUT.ctx.apps[idApp];

	if (NUT.ctx.curApp.apptype == "engine") {
		window.open(NUT.ctx.curApp.link + "?username=" + NUT.ctx.user.username + "&clientid=" + NUT.ctx.user.clientid);
		labCurrentApp.innerHTML = "";
	} else {
		var isGis = (NUT.ctx.curApp.apptype == "gis");
		divMain.innerHTML = '<div id="divTitle" style="padding:6px"><img width="64" height="64" src="site/' + NUT.ctx.curApp.siteid + '/' + idApp + '/icon.png"/><br/><h2><b style="color:brown">' + NUT.ctx.curApp.appname + '</b></h2><br/><hr/><br/><h3><i>' + NUT.ctx.curApp.description + '</i></h3></div>';
		divMain.style.backgroundImage = "";

		if (isGis) {
			NUT.ds.select({ from: "v_map_service", order: "seqno", where: ["appid", "=", idApp] }, function (maps) {
				if (maps.length) {
					var lookup = {};
					for (var i = 0; i < maps.length; i++) {
						var map = maps[i];
						map.subLayers = [];
						lookup[map.mapid] = map;
					}
					NUT.ds.select({ from: "n_layer", order: "seqno", where: ["appid", "=", idApp] }, function (res) {
						for (var i = 0; i < res.length; i++) {
							var lyr = res[i];
							lyr.maporder = lookup[lyr.mapid].seqno;
							lookup[lyr.mapid].subLayers.push(lyr);
						}
						var layers = [];
						for (var i = 0; i < maps.length; i++)if (maps[i].subLayers.length) layers.push(maps[i]);
						divMain.innerHTML = "<div id='divMapTool'></div>";
						w2ui.divApp.sizeTo("left", "50%", true);
						GSMap.createMap({
							layers: layers,
							divMap: divMain,
							divTool: divMapTool,
							view: {
								center: [108, 16],
								zoom: 11
							}
						});
						GSMap.awBasic.onFeatureSelect = map_onSelect;
					})
				}
			});
		}
		//load domain
		NUT.ds.select({ from: "n_domain", clientid: NUT.ctx.curApp.clientid, where: ["appid", "=", idApp] }, function (res) {
			if (res.success)
				NUT.ctx.domain = NUT.configDomain(res.results);
			else
				NUT.tagMsg("⛔ ERROR: " + res.results, 'red');
		});
		//load service
		NUT.ds.select({ from: "v_appservice_service", clientid: NUT.ctx.curApp.clientid, where: ["appid", "=", idApp] }, function (res) {
			NUT.ctx.service = {};
			if (res.success)
				for (var i = 0; i < res.length; i++)NUT.ctx.service[res[i].servicename] = res[i];
			else
				NUT.tagMsg("⛔ ERROR: " + res.results, 'red');
		});
		NUT.ds.select({ from: "v_rolemenu_menu", clientid: NUT.ctx.curApp.clientid, where: [["menutype", "=", "menu"], ["appid", "=", idApp], ["roleid", "=", NUT.ctx.curApp.roleid]] }, function (res) {
			if (res.success) {
				var ids = {}, pids = {};
				for (var i = 0; i < res.results.length; i++) {
					var rec = res.results[i];
					if (rec.menuid) ids[rec.menuid] = true;
					if (rec.parentid) pids[rec.parentid] = true;
				}
				NUT.ds.select({ from: "n_menu", order: "seqno", where: ["or", ["menuid", "in", Object.keys(ids)], ["menuid", "in", Object.keys(pids)]] }, function (res2) {
					if (res2.success) {
						var nodes = [], lookup = {}, openWinId = null;
						for (var i = 0; i < res2.results.length; i++) {
							var menu = res2.results[i];
							if (menu.linkwindowid && menu.isopen) openWinId = menu.linkwindowid;
							var node = { id: menu.menuid, label: menu.menuname, expanded: menu.isopen, value: menu.linkwindowid || menu.execname };
							if (menu.parentid) {
								var parent = lookup[menu.parentid];
								parent.group = true;
								if (parent.items) parent.items.push(node);
								else parent.items = [node];
							} else nodes.push(node);
							lookup[node.id] = node;
						};

						var mnuApp = new Smart.Menu("#divLeft", {
							dataSource: nodes,
							mode:"vertical"
						});
						mnuApp.addEventListener("itemClick", mnuApp_click);

						if (openWinId) mnuApp_click({ item: { tag: openWinId } });
					} else NUT.tagMsg("⛔ ERROR: " + res2.results, 'red');
				});
			} else NUT.tagMsg("⛔ ERROR: " + res.results, 'red');
			NUT.loading.closeAll();
		});
	}
}

function mnuApp_click(evt) {
	var tag = evt.detail.value;
	if (Number.isInteger(tag)) {
		var win = new NWindow(tag);
		var a = createWindowTitle(tag, divTitle);
		var conf = NUT.ctx.winconfig[tag];
		if (conf) {
			if (conf.componentname)
				runComponent(conf.componentname, a.div);
			else {
				conf.tabs[0].tempWhere = evt.tempWhere;
				win.buildWindow(a.div, conf, 0);
			}
			a.innerHTML = conf.windowname;
		} else {
			NUT.ds.select({ from: "n_cache", where: ["windowid", "=", tag] }, function (res) {
				if (res.success) {
					var cache = res.results[0];
					if (cache) {
						conf = NUT.configWindow(zipson.parse(cache.config), JSON.parse(cache.layout));
						if (conf.componentname) {
							runComponent(conf.componentname, a.div);
						} else {
							conf.tabs[0].tempWhere = evt.tempWhere;
							conf.tabid = conf.windowid;
							NUT.ctx.winconfig[tag] = conf;
							var needCaches = [];
							/*for (var key in conf.needCache) {
								if (conf.needCache.hasOwnProperty(key) && !NUT.ctx.domain[key]) needCaches.push(conf.needCache[key]);
							}*/
							win.buildWindow(a.div, conf, 0);
						}
						a.innerHTML = conf.windowname;
					} else NUT.tagMsg("⚠️ No cache for window " + tag, 'yellow');
				} else NUT.tagMsg("⛔ ERROR: " + res.results, 'red');
			});
		}
		//if (_isMobile && !w2ui.w2menu.flat) w2ui.w2menu.goFlat();
		NUT.ctx.curWinid = tag;
	} else {
		runComponent(tag);
	}
}

function createWindowTitle(id, divTitle, noClose) {
	if (!NUT.ctx.curWinid) divTitle.innerHTML = "";
	else for (var i = 0; i < divTitle.childNodes.length; i++) {
		var node = divTitle.childNodes[i].firstChild;
		node.style.color = "gray";
		if (id == node.tag) {
			node.onclick();
			return;
		}
	}

	var divWindow = divTitle.parentNode;
	for (var i = 1; i < divWindow.childNodes.length; i++)
		divWindow.childNodes[i].style.display = "none";

	var div = document.createElement("div");
	div.className = "nut-full";
	divWindow.appendChild(div);

	var span = document.createElement("span");
	var a = document.createElement("i");
	a.innerHTML = " ... ";
	a.className = "nut-link";
	a.div = div;
	a.tag = id;
	a.onclick = function () {
		var children = this.div.parentNode.childNodes;
		for (var i = 1; i < children.length; i++)
			children[i].style.display = "none";
		this.div.style.display = "";

		children = this.parentNode.parentNode.childNodes;
		for (var i = 0; i < children.length; i++)
			children[i].firstChild.style.color = "gray";
		this.style.color = "";

		NUT.ctx.curWinid = this.tag;
	};
	span.appendChild(a);

	var close = document.createElement("span");
	close.className = "nut-close";
	close.innerHTML = noClose ? "    " : " ⛌   ";
	close.tag = id;
	if (!noClose) close.onclick = function () {
		var title = this.parentNode.parentNode;
		this.previousElementSibling.div.remove();
		this.parentNode.remove();
		if (this.tag == NUT.ctx.curWinid) {
			if (title.childNodes.length) title.childNodes[0].firstChild.onclick();
			else NUT.ctx.curWinid = null;
		}
	}
	span.appendChild(close);

	divTitle.appendChild(span);
	return a;
}

