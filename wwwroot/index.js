import { w2ui, w2layout, w2toolbar, w2form, w2utils, w2confirm, w2alert, w2popup, w2sidebar } from "../lib/w2ui.es6.min.js";
import { NWin } from "./js/window.js";
import { SqlREST } from "./js/sqlrest.js";

w2utils.settings.dataType = "RESTFULL";
w2utils.settings.dateFormat = "yyyy-mm-dd";
w2utils.settings.datetimeFormat = "yyyy-mm-dd";
w2utils.settings.timeFormat = "hh:mm:ss";
w2utils.settings.currencySuffix = "₫";
w2utils.settings.groupSymbol = "`";

NUT.ds = SqlREST;
NUT.w2alert = w2alert;
NUT.w2confirm = w2confirm;
NUT.utils = w2utils;
NUT.w2ui = w2ui;

window.onload = function () {
	document.body.innerHTML = '<div id="divLogin" class="nut-full"></div>';
	(w2ui["frmLogin"] || new w2form({
		name: "frmLogin",
		style: "width:360px;height:220px;top:30%;margin:auto",
		header: '🗝️ <i class="nut-link">Login</i>',
		fields: [
			{ field: 'Username', type: 'text' },
			{ field: 'Password', type: 'password' },
			{ field: 'SavePassword', type: 'checkbox' },
		],
		record: localStorage.getItem(NUT.I_PASS) ? { Username: atob(localStorage.getItem(NUT.I_USER)), Password: atob(localStorage.getItem(NUT.I_PASS)), SavePassword: true } : { Username: atob(localStorage.getItem(NUT.I_USER)), Password: "", SavePassword: false },
		actions: {
			"❔ Help": function () {
				window.open('help.html');
			},
			custom: {
				text: "🗝️ Login",
				class: "w2ui-btn-blue",
				onClick: function () {
					NUT.loading(divLogin);
					var self = this;
					NUT.ds.select({ url: NUT.URL + "nv_user_site", where: [["username", "=", this.record.Username], ["password", "=", this.record.Password]] }, function (res) {
						if (res.success) {
							if (res.result.length == 1) {
								c$.user = res.result[0];
								localStorage.setItem(NUT.I_USER, btoa(self.record.Username));
								localStorage.setItem(NUT.I_PASS, self.record.SavePassword ? btoa(self.record.Password) : "");
								
								(w2ui["layMain"] || new w2layout({
									name: "layMain",
									style: "width:100%;height:100%;top:0;margin:0",
									panels: [
										{ type: 'top', size: 38, html: '<div id="divTop" class="nut-full"></div>' },
										{ type: 'left', size: 300, resizable: true, html: '<div id="divLeft" class="nut-full"></div>', hidden: true },
										{ type: 'main', html: '<div id="divMain" class="nut-full" style="background:url(\'site/' + c$.user.siteid + '/back.png\');background-size:cover"><div id="divApp" style="position:absolute;width:100%;top:30%"></div><div id="divTool" style="position:absolute;width:100%;bottom:10px"></div></div>' }
									],
								})).render(divLogin);

								(w2ui["tbrTop"] || new w2toolbar({
									name: "tbrTop",
									items: [
										{ type: 'html', id: 'logo', html: '<img src="site/' + c$.user.siteid + '/logo.png"/>' },
										{ type: 'html', id: 'site', html: '<b>' + c$.user.sitecode + '</b><br/>' + c$.user.sitename },
										{ type: 'spacer', id: "divSpacer" },
										{ type: 'button', id: "home", icon: "nut-i-home", tooltip: "Home" },
										{ type: 'button', id: "notify", icon: "nut-i-notification", tooltip: "Notify" },
										{ type: 'button', id: "job", icon: "nut-i-information", tooltip: "Job" },
										{ type: 'break' },
										{
											type: 'menu', id: 'user', text: c$.user.username, items: [
												{ id: 'profile', text: 'Profile...' },
												{ id: 'changepass', text: 'Change password' },
												{ text: '--' },
												{ id: 'logout', text: 'Logout' }]
										},
										{ type: 'break' },
										{ type: 'button', id: "app", icon: "nut-i-switcher", tooltip: "Applications" }
									],
									onClick(evt) {
										if (evt.target == "user:profile") {
											w2alert("<table><tr><td><b><i>Tài khoản:</i></b></td><td colspan='3'>" + c$.user.username + "</td></tr><tr><td><b><i>Họ tên:</i></b></td><td colspan='3'>" + c$.user.fullname + "</td></tr><tr><td><b><i>Điện thoại:</i></b></td><td>" + c$.user.phone + "</td><td><b><i>Nhóm:</i></b></td><td>" + c$.user.groupid + "</td></tr><tr><td><b><i>Trạng thái:</i></b></td><td>" + c$.user.status + "</td><td><b><i>Ghi chú:</i></b></td><td>" + c$.user.description + "</td></tr></table>", "<b>ℹ️ Information #<i>" + c$.user.userid + "</i></b>");
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
								})).render(divTop);

								openDesktop();
								//renderMain();
							} else NUT.notify("⚠️ Login fail for user " + self.record.Username,"yellow");
						} else NUT.notify("⛔ ERROR: " + res.result, "red");
						NUT.loading();
					}, true);
				}
			}
		}
	})).render(divLogin);
}

function openDesktop() {
	NUT.ds.select({ url: NUT.URL + "nv_access_app", orderby: "seqno", where: ["userid", "=", c$.user.userid] }, function (res) {
		if (res.success) {
			var id = null;
			var appHtml = "<center>";
			var toolHtml = "<center>";
			for (var i = 0; i < res.result.length; i++) {
				var data = res.result[i];
				if (data.appid != null) {
					if (id != data.appid) {
						id = data.appid;
						NUT.apps[id] = data;
						if (data.issystem) {
							toolHtml += "<div class='nut-tool' onclick='openApp(" + id + ")' title='" + data.description + "'><img src='site/" + data.siteid + "/"+id+"/icon.png'/></div>";
						} else {
							appHtml += "<div class='nut-tile' style='background:" + data.color + "' onclick='openApp(" + id + ")' title='" + data.description + "'><img src='site/" + data.siteid + "/" + id +"/icon.png'/><br/>" + data.appname + "</div>";
						}
					}
				}
			};
			divApp.innerHTML = appHtml + "</center>";
			divTool.innerHTML = toolHtml + "</center>";
			//if (res.length == 1) openApplication(id);
		} else NUT.notify("⛔ ERROR: " + res.result, "red");
	});
}

function userChangePassword(){
	var user=c$.user;
	if(txtUser_PasswordOld.value&&txtUser_PasswordNew.value&&txtUser_PasswordNew2.value){
		if(txtUser_PasswordOld.value==user.password&&txtUser_PasswordNew.value==txtUser_PasswordNew2.value)
			NUT.ds.update({ url: NUT.URL + "n_user", data: { password: txtUser_PasswordNew.value }, where: [["userid", "=", user.userid], ["password", "=", txtUser_PasswordOld.value]] }, function (res) {
				if (res.success)
					NUT.alert("<span style='color:green'>Password change!</span>");
				else
					NUT.notify("⛔ ERROR: " + res.result, "red");
			})
		else w2alert("<span style='color:orange'>Passwords not match!</span>");
	}else w2alert("<span style='color:orange'>Old password, new password and retype password are all required!</span>");
}

window.openApp=function(id){
	//load menu
	c$.app=NUT.apps[id];
	
	if(c$.app.apptype=="engine"){
		window.open(c$.app.link+"?username="+c$.user.username+"&clientid="+c$.user.clientid);
		labCurrentApp.innerHTML="";
	}else {
		var isGis=(c$.app.apptype=="gis");
		divMain.innerHTML = '<div id="divTitle" style="padding:6px"><img width="64" height="64" src="site/' + c$.user.siteid+'/'+id+'/icon.png"/><br/><h2><b style="color:brown">'+c$.app.appname+'</b></h2><br/><hr/><br/><h3><i>'+c$.app.description+'</i></h3></div>';
		divMain.style.backgroundImage="";
		
		if(isGis){
			NUT.ds.select({ url: NUT.URL + "nv_map_service",orderby:"seqno",where:["appid","=",id]},function(res){
				if (res.success) {
					var maps = res.result;
					var lookup={};
					for(var i=0;i<maps.length;i++){
						var map=maps[i];
						map.subLayers=[];
						lookup[map.mapid]=map;
					}
					NUT.ds.select({ url: NUT.URL + "n_layer",orderby:"seqno",where:["appid","=",id]},function(res2){
						if (res2.success) {
							for (var i = 0; i < res2.result.length; i++) {
								var lyr = res.result[i];
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
						} else NUT.notify("⛔ ERROR: " + res2.result, "red");
					})
				} else NUT.notify("⛔ ERROR: " + res.result, "red");
			});
		}
		//load domain
		NUT.ds.select({ url: NUT.URL + "n_domain",where:["appid","=",id]},function(res){
			if (res.success)
				NUT.domains = NUT.configDomain(res.result);
			else
				NUT.notify("⛔ ERROR: " + res.result, "red");
		});
		//load service
		NUT.ds.select({ url: NUT.URL + "nv_appservice_service",clientid:c$.user.siteid,where:["appid","=",id]},function(res){
			c$.service = {};
			if (res.success)
				for (var i = 0; i < res.length; i++)c$.service[res[i].servicename] = res[i];
			else
				NUT.notify("⛔ ERROR: " + res.result, "red");
		});
		NUT.ds.select({ url: NUT.URL + "nv_rolemenu_menu",where:[["menutype","=","menu"],["appid","=",id],["roleid","=",c$.app.roleid]]},function(res){
			if (res.success) {
				var ids = {}, pids = {};
				for (var i = 0; i < res.result.length; i++) {
					var rec = res.result[i];
					if (rec.menuid) ids[rec.menuid] = true;
					if (rec.parentid) pids[rec.parentid] = true;
				}
				var pkeys = Object.keys(pids);
				var where = (pkeys.length ? ["or", ["menuid", "in", Object.keys(ids)], ["menuid", "in", pkeys]] : ["menuid", "in", Object.keys(ids)]);
				NUT.ds.select({ url: NUT.URL + "n_menu", orderby: "seqno", where: where }, function (res2) {
					if (res2.success) {
						var nodes = [], lookup = {}, openWinId = null;
						for (var i = 0; i < res2.result.length; i++) {
							var menu = res2.result[i];
							if (menu.linkwindowid && menu.isopen) openWinId = menu.linkwindowid;
							var node = { id: menu.menuid, text: menu.menuname, expanded: menu.isopen, tag: menu.linkwindowid || menu.execname, where: JSON.parse(menu.whereclause) };
							if (menu.parentid) {
								var parent = lookup[menu.parentid];
								parent.group = true;
								if (parent.nodes) parent.nodes.push(node);
								else parent.nodes = [node];
							} else nodes.push(node);
							lookup[node.id] = node;
						};
						//SYSTEM APPLICATION
						if (id == 0) {
							var childs = [];
							for (var key in NUT.apps) if (NUT.apps.hasOwnProperty(key)) {
								var app = NUT.apps[key];
								childs.push({ id: "app_" + app.appid, text: app.appname, tag: (app.apptype == "app"?3:5), where: ["appid", "=", app.appid] });
							}
							nodes.push({ id: "app_", text: "🌰 Applications", group:true, expanded: true, nodes:childs });
						}

						(w2ui["mnuMain"]||new w2sidebar({
							name: "mnuMain",
							flatButton: true,
							nodes: nodes,
							topHTML: '<div><input placeholder="⌕ Search..." style="width:100%"/></div>',
							onClick: menu_onClick,
							onFlat: function (evt) {
								var width = NUT.isMobile ? "100%" : "300px";
								w2ui.layMain.sizeTo("left", evt.detail.goFlat ? '40px' : width, true);
								divLeft.style.width = (evt.detail.goFlat ? '40px' : width);
							}
						})).render(divLeft);

						w2ui.layMain.show("left");
						if (openWinId) menu_onClick({ item: { tag: openWinId }});
					} else NUT.notify("⛔ ERROR: " + res2.result, "red");
				});
			} else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
	}
}
function map_onSelect(evt){
	if(evt.tool=="toolSelect"){
		var tabconf=NUT.wins[c$.winid].tabs[0];
		var grid=w2ui["grid_"+tabconf.tabid];
		var where=["or"];
		for(var i=0;i<evt.features.length;i++){
			var feat=evt.features[i];
			var lyrconf=GSMap.getLayerConfig(feat.getId().split(".")[0]);
			if(lyrconf.windowid==c$.winid){
				var attr=feat.getProperties();
				var clause=[];
				for(var j=0;j<tabconf.fields.length;j++){
					var field=tabconf.fields[j];
					if(field.columndohoa&&attr[field.columndohoa]){
						if(attr[field.columndohoa])clause.push([field.columndohoa,"=",attr[field.columndohoa]]);
						else {clause=[];break}
					}
				}
				if (clause.length)where.push(clause);
			}
		}
		if(where.length>1){
			grid.postData.select=where;
			grid.reload();
		}
	}
}

function menu_onClick(evt) {
	var tag = evt.object.tag;
	if (Number.isInteger(tag)) {
		var appName = Number.isInteger(evt.object.id) ? undefined : evt.object.text;
		var conf = NUT.wins[tag];
		var a = createWindowTitle(tag, divTitle, appName);
		if (!a) {//already open
			if (appName) {
				var grid = NUT.w2ui["grid_" + conf.tabs[0].tabid];
				grid.tab.tag.tempWhere = evt.object.where;
				grid.reload();
			}
			return;
		}
		var win = new NWin(tag);
		if (conf) {
			conf.tabs[0].tempWhere=evt.object.where;
			win.buildWindow(a.div, conf, 0);
			a.innerHTML = conf.windowname;
		}else{
			NUT.ds.select({ url: NUT.URL + "n_cache",where:["windowid","=",tag]},function(res){
				if (res.success) {
					var cache = res.result[0];
					if (cache) {
						conf = NUT.configWindow(zipson.parse(cache.config), JSON.parse(cache.layout));
						conf.tabs[0].tempWhere = evt.object.where;
						conf.tabid = conf.windowid;
						NUT.wins[tag] = conf;
						var needCaches = [];
						for (var key in conf.needCache) {
							if (conf.needCache.hasOwnProperty(key) && !NUT.domains[key]) needCaches.push(conf.needCache[key]);
						}
						win.buildWindow(a.div, conf, 0);
						
						a.innerHTML = appName||conf.windowname;
					} else NUT.notify("⚠️ No cache for window "+tag,"yellow");
				} else NUT.notify("⛔ ERROR: " + res.result, "red");
			});
		}
		if(NUT.isMobile&&!w2ui.w2menu.flat)w2ui.w2menu.goFlat();
		c$.winid=tag;
	}else{
		NUT.runComponent(tag);
	}
}

function createWindowTitle(id, divTitle, appName){
	if (c$.winid)
		for (var i = 0; i < divTitle.childNodes.length; i++) {
			var node = divTitle.childNodes[i].firstChild;
			node.style.color = "gray";
			if (id == node.tag) {
				if (appName) node.innerHTML = appName;
				node.onclick();
				return;
			}
		}
	else divTitle.innerHTML = "";

	var divWindow = divTitle.parentNode;
	for (var i = 1; i < divWindow.childNodes.length; i++)
		divWindow.childNodes[i].style.display = "none";

	var div = document.createElement("div");
	div.className = "nut-full";
	divWindow.appendChild(div);

	var span = document.createElement("span");
	var a = document.createElement("i");
	a.innerHTML = " Loading... ⌛ ";
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

		c$.winid = this.tag;
	};
	span.appendChild(a);

	var close = document.createElement("span");
	close.className = "nut-close";
	close.innerHTML = " ⛌   ";
	close.tag = id;
	close.onclick = function () {
		var title = this.parentNode.parentNode;
		this.previousElementSibling.div.remove();
		this.parentNode.remove();
		if (this.tag == c$.winid) {
			if (title.childNodes.length) title.childNodes[0].firstChild.onclick();
			else c$.winid = null;
		}
	}
	span.appendChild(close);

	divTitle.appendChild(span);
	return a;
}

function linkfield_onClick(windowid,value,wherefield){
	menu_onClick({ item: { tag: windowid }, object: { where: [wherefield, "=", value] } });
	event.stopImmediatePropagation();
}

