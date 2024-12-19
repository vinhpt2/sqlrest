import { w2ui, w2layout, w2toolbar, w2form, w2utils, w2popup, w2sidebar,w2tooltip,w2confirm,w2tabs,w2menu} from "../lib/w2ui.es6.min.js";
import { NWin } from "../js/window.js";
import { SqlREST } from "../js/sqlrest.js";

w2utils.settings.dataType = "RESTFULL";

NUT.ds = SqlREST;
NUT.w2ui = w2ui;
NUT.w2utils = w2utils;
NUT.w2confirm = w2confirm;
NUT.w2popup = w2popup;
NUT.w2form = w2form;
NUT.w2layout = w2layout;
NUT.w2toolbar = w2toolbar;
NUT.w2sidebar = w2sidebar;
NUT.w2tooltip = w2tooltip;
NUT.w2tabs = w2tabs;
NUT.w2menu = w2menu;
NUT.NWin = NWin;
window.onload = function () {
	n$.user = null;
	document.body.innerHTML = "<div id='divLogin'></div>";
	w2utils.locale(localStorage.getItem("locale") || w2utils.settings.locale).then(function (evt) {
		n$.locale = evt.data.locale.substr(0, 2);
		n$.phrases = evt.data.phrases;
		var cookie = NUT.cookie();
		(w2ui["frmLogin"] || new w2form({
			name: "frmLogin",
			style: "width:" + NUT.MOBILE_W +"px;height:220px;top:33%;margin:auto",
			header: "_NUT",
			fields: [
				{ field: 'username', type: 'text', html: { label: "_Username", text: "%site%", attr: "style='width:120px'" } },
				{ field: 'sitecode', type: 'text', html: { label: " . ", anchor: '%site%', attr: "style='width:60px'" }},
				{ field: 'password', type: 'password', html: { label: "_Password", attr: "style='width:190px'" } },
				{ field: 'savepass', type: 'checkbox', html: { label: "_SavePassword" } }
			],
			record: cookie,
			actions:{
				"_Help": function () {
					window.open('help.html');
				},
				"_Login": function () {
					var rec = this.record;
					login(rec);
					/*cookie.password ? login(rec) : NUT.w2utils.sha256(rec.password).then(function (md5) {
						rec.password = md5;
						login(rec);
					});*/
				}
			}
		})).render(divLogin);
		divLogin.z(["select", {
			style: 'position:inherit;float:right',
			innerHTML: "<option value='en-US'>🇺🇸</option><option value='vi-VN'>🇻🇳</option>",
			value: evt.data.locale,
			onchange: function () {localStorage.setItem("locale", this.value);location.reload()}
		}]);
	})
}

function login(cookie) {
	NUT.loading(divLogin);
	NUT.ds.get({ url: NUT.URL_TOKEN, data: [cookie.username, cookie.sitecode, cookie.password], method:"POST" }, function (res) {
		if (res.success) {
			n$.user = res.result;
			document.body.style.backgroundImage = "url('site/" + n$.user.siteid +"/back.png')";
			
			SqlREST.token = "Bearer " + n$.user.token;
			NUT.cookie(cookie);
			//user select role
			var roles = [];
			for (var key in res.result.roles) if (res.result.roles.hasOwnProperty(key)) {
				roles.push(res.result.roles[key]);
			}
			var orgs = [];
			for (var key in res.result.orgs) if (res.result.orgs.hasOwnProperty(key)) {
				orgs.push(res.result.orgs[key]);
			}
			if (roles.length == 1 && orgs.length <= 1) {
				var orgid = orgs[0] ? orgs[0].id : null;
				NUT.ds.get({ url: NUT.URL_TOKEN, data: [roles[0].id,orgid], method: "PUT" }, function (res) {
					if (res.success) {
						n$.user.roleid = roles[0].id;
						n$.user.orgid = orgid;
						NUT.access = res.result;
						openDesktop();
					} else NUT.notify("⛔ ERROR: " + res.result, "red");
				});
			} else {
				var fields = [{ field: 'roleid', type: 'select', html: { label: "_Role" }, options: { items: roles } }];
				var record = { roleid: roles[0].id };
				if (orgs.length) {
					fields.push({ field: 'orgid', type: 'select', html: { label: "_Org" }, options: { items: orgs } });
					record.orgid = orgs[0].id;
				}
				divLogin.innerHTML = "";
				(w2ui["frmRoleOrg"] || new w2form({
					name: "frmRoleOrg",
					style: "width:" + NUT.MOBILE_W +"px;top:33%;margin:auto;height:170px",
					header: '<img height="16" src="site/' + n$.user.siteid + '/logo.png"/> <span><b>' + n$.user.sitename + '</b> - ' + (NUT.isMobile ? n$.user.sitecode : NUT.translate(n$.user.sitedesc)) + '</span>',
					fields: fields,
					record: record,
					actions: {
						"_Cancel": function () {
							location.reload();
						},
						"_Ok": function () {
							var rec = this.record;
							NUT.ds.get({ url: NUT.URL_TOKEN, data: [rec.roleid,rec.orgid], method: "PUT" }, function (res) {
								if (res.success) {
									n$.user.roleid = rec.roleid;
									n$.user.orgid = rec.orgid;
									NUT.access = res.result;
									openDesktop();
								} else NUT.notify("⛔ ERROR: " + res.result, "red");
							});
						}
					}
				})).render(divLogin);
			}
			//renderMain();
		} else NUT.notify("⛔ ERROR: " + res.result, "red");
		NUT.loading();
	});
}

function openDesktop() {
	(w2ui["layMain"] || new w2layout({
		name: "layMain",
		style: "width:100%;height:100%;top:0;margin:0",
		panels: [
			{ type: 'top', size: 38, html: '<div id="divTop" class="nut-full"></div>' },
			{ type: 'left', size: NUT.isMobile ? "100%" : NUT.MOBILE_W, resizable: true, html: '<div id="divLeft" class="nut-full"></div>', hidden: true },
			{ type: 'main', html: '<div id="divMain" class="nut-full" style="background:url(\'site/' + n$.user.siteid + '/back.png\');background-size:cover"><div id="divApp" style="position:absolute;width:100%;top:30%"></div><div id="divTool" style="position:absolute;width:100%;bottom:10px"></div></div>' }
		],
	})).render(divLogin);

	(w2ui["tbrTop"] || new w2toolbar({
		name: "tbrTop",
		items: [
			{ type: 'html', id: 'logo', html: '<img height="24" src="site/' + n$.user.siteid + '/logo.png"/>' },
			{ type: 'html', id: 'site', html: '<div><b>' + n$.user.sitename + '</b><br/>' + (NUT.isMobile?n$.user.sitecode:NUT.translate(n$.user.sitedesc)) + '</div>' },
			{ type: 'spacer', id: "divSpace" },
			{ type: 'break' },
			{ type: 'button', id: "home", icon: "nut-i-home", title: "_Home" },
			{ type: 'button', id: "notify", icon: "nut-i-notification", title: "_Notify" },
			{ type: 'button', id: "job", icon: "nut-i-information", title: "_Job" },
			{ type: 'break' },
			{
				type: 'menu', id: 'user', text: n$.user.username, icon: 'w2ui-icon-colors', items: [
					{ id: 'profile', text: '_Profile' },
					{ id: 'changepass', text: '_ChangePassword' },
					{ text: '--' },
					{ id: 'logout', text: '_Logout' }]
			},
			{ type: 'break' },
			{ type: 'button', id: "app", icon: "nut-i-switcher" }
		],
		onClick(evt) {
			switch (evt.target) {
				case "user:profile":
					w2alert("<table><tr><td><b><i>Tài khoản:</i></b></td><td colspan='3'>" + n$.user.username + "</td></tr><tr><td><b><i>Họ tên:</i></b></td><td colspan='3'>" + n$.user.fullname + "</td></tr><tr><td><b><i>Điện thoại:</i></b></td><td>" + n$.user.phone + "</td><td><b><i>Nhóm:</i></b></td><td>" + n$.user.groupid + "</td></tr><tr><td><b><i>Trạng thái:</i></b></td><td>" + n$.user.status + "</td><td><b><i>Ghi chú:</i></b></td><td>" + n$.user.description + "</td></tr></table>", "<b>Information #<i>" + n$.user.userid + "</i></b>");
					break;
				case "user:changepass":
					NUT.openDialog({
						title: "🔑 <i>Change password</i>",
						width: NUT.MOBILE_W,
						height: 210,
						div: "<table style='margin:auto'><tr><td>*Old password:</b></td><td><input class='w2ui-input' id='txt_PasswordOld' type='password'/></td></tr><tr><td>*New password:</b></td><td><input class='w2ui-input' id='txt_PasswordNew' type='password'/></td></tr><tr><td>*Re-type password:</b></td><td><input class='w2ui-input' id='txt_PasswordNew2' type='password'/></td></tr></table>",
						actions: {
							"_Close": function () { NUT.closeDialog() },
							"_Ok": function () {
								if (txt_PasswordOld.value && txt_PasswordNew.value && txt_PasswordNew2.value) {
									if (txt_PasswordOld.value == n$.user.password && txt_PasswordNew.value == txt_PasswordNew2.value)
										NUT.ds.update({ url: NUT.URL + "n_user", data: { password: txt_PasswordNew.value }, where: [["userid", "=", n$.user.userid], ["password", "=", txt_PasswordOld.value]] }, function (res) {
											if (res.success) NUT.notify("Password change","lime");
											else NUT.notify("⛔ ERROR: " + res.result, "red");
										})
									else NUT.notify("⚠️ Passwords not match!","orange");
								} else NUT.notify("⚠️ Old password, new password and Retype password are all required!","orange");
							}
						}
					});
					break;
				case "user:logout":
					w2ui.layMain.hide("left"); location.reload();
					break;
				case "app":
					w2tooltip.show({ name: "mnuShortcut", html: NUT.shortcut, anchor: evt.detail.originalEvent.target, hideOn: ['doc-click'] })
					break;
			}
		}
	})).render(divTop);

	NUT.ds.select({ url: NUT.URL + "nv_role_app", orderby: "seqno", where: ["roleid", "=", n$.user.roleid] }, function (res) {
		if (res.success) {
			var id = null;
			var appHtml = "<center>";
			var toolHtml = "<center>";
			var countApp=0,idOnlyApp=null;
			for (var i = 0; i < res.result.length; i++) {
				var data = res.result[i];
				if (data.appid != null) {
					if (id != data.appid) {
						id = data.appid;
						data.appname = NUT.translate(data.translate) || data.appname;
						data.description = NUT.translate(data.description);
						NUT.apps[id] = data;
						if (res.result.length == 1){//only one app
							openApp(data.appid);
							return;
						}
						if (data.issystem){
							toolHtml += "<div class='nut-tool' onclick='openApp(" + id + ")' title='" + data.appname + "'><img src='site/" + data.siteid + "/" + id + "/icon.png'/></div>";
						}else{
							appHtml += "<div title='" + data.description + "' class='nut-tile' style='background:#" + data.color + "' onclick='openApp(" + id + ")'><br/><img src='site/" + data.siteid + "/" + id + "/icon.png'/><br/>" + data.appname + "</div>";
							idOnlyApp=id;
							countApp++;
						}
					}
				}
			};
			divApp.innerHTML = appHtml + "</center>";
			divTool.innerHTML = toolHtml + "</center>";
			NUT.shortcut = "<div style='transform: scale(0.8)'>" + divTool.innerHTML + "<hr/>" + divApp.innerHTML + "</div>";
			if(countApp==1)openApp(idOnlyApp);
		} else NUT.notify("⛔ ERROR: " + res.result, "red");
	});
}

window.openApp = function (id) {
	w2tooltip.hide("mnuShortcut");
	//load menu
	n$.app = NUT.apps[id];
	if (n$.app.apptype == "engine") {
		window.open(n$.app.link + "?username=" + n$.user.username + "&siteid=" + n$.user.siteid);
		labCurrentApp.innerHTML = "";
	} else {
		var isGis = (n$.app.apptype == "gis");
		divMain.innerHTML = '<div id="divTitle" style="padding:6px"><img width="64" height="64" src="site/' + n$.app.siteid + '/' + id + '/icon.png"/><br/><h2><b style="color:brown">' + n$.app.appname + '</b></h2><br/><hr/><br/><h3>' + n$.app.description + '</h3></div>';
		divMain.style.backgroundImage = "";
		var where = ["appid", "=", id];
		if (isGis) {
			NUT.ds.select({ url: NUT.URL + "nv_map_service", orderby: "seqno", where: where }, function (res) {
				if (res.success) {
					var maps = res.result;
					var lookup = {};
					for (var i = 0; i < maps.length; i++) {
						var map = maps[i];
						map.subLayers = [];
						lookup[map.mapid] = map;
					}
					NUT.ds.select({ url: NUT.URL + "n_layer", orderby: "seqno", where: where }, function (res2) {
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
		//cache domain
		NUT.ds.select({ url: NUT.URL + "n_domain", where: where }, function (res) {
			if (res.success) {
				var domain = {};
				for (var i = 0; i < res.result.length; i++) {
					var data = res.result[i];
					domain[data.domainid] = { items: [NUT.DM_NIL], lookup: {}, lookdown: {} };
					var item = JSON.parse(data.domainjson);
					for (var j = 0; j < item.length; j++) {
						domain[data.domainid].items.push({ id: item[j][0], text: item[j][1] });
						domain[data.domainid].lookup[item[j][0]] = item[j][1];
						domain[data.domainid].lookdown[item[j][1]] = item[j][0];
					}
				}
				domain[-1] = {
					items: [{ id: n$.user.siteid, text: n$.user.sitecode }],
					lookdown: { [n$.user.sitecode]: n$.user.siteid },
					lookup: { [n$.user.siteid]: n$.user.sitecode }
				};
				NUT.domains = domain;
			} else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
		//cache service
		NUT.ds.select({ url: NUT.URL + "nv_appservice_service", where: where }, function (res) {
			if (res.success) {
				NUT.services = {};
				var dm = { items: [NUT.DM_NIL], lookup: {}, lookdown: {} };
				for (var i = 0; i < res.result.length; i++) {
					var service = res.result[i];
					NUT.services[service.serviceid] = service;

					var item = { id: service.serviceid, text: service.servicename };
					dm.items.push(item);
					dm.lookup[item.id] = item.text;
					dm.lookdown[item.text] = item.id;
				}
				if(dm.items.length)NUT.dmlinks[dm.items[0].id] = dm;
				//cache table
				NUT.ds.select({ url: NUT.URL + "nv_appservice_table", where: where }, function (res2) {
					if (res2.success) {
						NUT.tables = {};
						var cacheTables = [];
						var relateTableIds = [];
						var dm = { items: [NUT.DM_NIL], lookup: {}, lookdown: {} };
						for (var i = 0; i < res2.result.length; i++) {
							var table = res2.result[i];
							var url = NUT.services[table.serviceid].url + "data/";
							table.urlview = url + (table.viewname || table.tablename);
							table.urledit = url + table.tablename;
							NUT.tables[table.tableid] = table;
							if (table.tabletype == "relate") relateTableIds.push(table.tableid);

							var item = { id: table.tableid, text: table.tablename };
							dm.items.push(item);
							dm.lookup[item.id] = item.text;
							dm.lookdown[item.text] = item.id;
							if (table.iscache) cacheTables.push(table);
						}
						if (dm.items.length) NUT.dmlinks[dm.items[0].id] = dm;
						//assign columnkey, columndisplay...
						var keys = Object.keys(NUT.tables);
						if(keys.length)NUT.ds.select({ url: NUT.URL + "n_column", where: [["columntype", "!is", null], ["tableid", "in", keys]] }, function (res3) {
							if (res3.success) {
								for (var i = 0; i < res3.result.length; i++) {
									var col = res3.result[i];
									var table = NUT.tables[col.tableid];
									table["column" + col.columntype] = col.columnname;
								}
							} else NUT.notify("⛔ ERROR: " + res3.result, "red");
							//cache cached table
							for (var i = 0; i < cacheTables.length; i++) {
								var table = cacheTables[i];
								NUT.cacheDmLink(table);
							}
						});
						//cache relate
						if (relateTableIds.length) NUT.ds.select({ url: NUT.URL + "n_column", where: [["linktableid", "!is", null], ["tableid", "in", relateTableIds]] }, function (res3) {
							if (res3.success) {
								NUT.relates = {};
								var lookupColumn = {};
								for (var i = 0; i < res3.result.length; i++) {
									var col = res3.result[i];
									if (!lookupColumn[col.tableid]) lookupColumn[col.tableid]= [col];
									else lookupColumn[col.tableid][1] = col;
								}
								for (var key in lookupColumn) if (lookupColumn.hasOwnProperty(key)) {
									var rel = lookupColumn[key];
									NUT.relates[rel[0].linktableid+"_"+rel[1].linktableid] = rel;
								}
							} else NUT.notify("⛔ ERROR: " + res3.result, "red");
						});
					} else NUT.notify("⛔ ERROR: " + res2.result, "red");
				});
			} else NUT.notify("⛔ ERROR: " + res.result, "red");
		});
		
		NUT.ds.select({ url: NUT.URL + "nv_rolemenu_menu", where: [["appid", "=", id], ["roleid", "=", n$.app.roleid], ["menutype", "=", "menu"]] }, function (res) {
			if (res.success&&res.result.length) {
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
							var node = { id: menu.menuid, text: NUT.translate(menu.translate) || menu.menuname, expanded: menu.isopen, tag: menu.linkwindowid || menu.execname, where: JSON.parse(menu.whereclause) };
							if (menu.parentid) {
								var parent = lookup[menu.parentid];
								parent.group = true;
								if (parent.nodes) parent.nodes.push(node);
								else parent.nodes = [node];
							} else nodes.push(node);
							lookup[node.id] = node;
						};

						if (id==1) {//LIST SYSTEM APPLICATIONS
							var childs = [];
							for (var key in NUT.apps) if (NUT.apps.hasOwnProperty(key)) {
								var app = NUT.apps[key];
								if (n$.user.roleid==1) childs.push({ id: "app_" + app.appid, text: app.appname, tag: (app.apptype == "engine" ? 5 : 3), where: ["apptype", "=", "app"] });
							}
							nodes.push({ id: "app_", text: "_Application", group: true, expanded: true, nodes: childs });
						}

						(w2ui["mnuMain"] || new w2sidebar({
							name: "mnuMain",
							flatButton: true,
							nodes: nodes,
							//topHTML: '<div class="nut-link">MENU</div>',//'<input placeholder="⌕ Search..." style="width:100%"/>',
							onClick: menu_onClick,
							onFlat: function (evt) {
								var width = NUT.isMobile ? "100%" : NUT.MOBILE_W+"px";
								w2ui.layMain.sizeTo("left", evt.detail.goFlat ? '40px' : width, true);
								divLeft.style.width = (evt.detail.goFlat ? '40px' : width);
							}
						})).render(divLeft);

						w2ui.layMain.show("left");
						if (openWinId) menu_onClick({ item: { tag: openWinId } });
					} else NUT.notify("⛔ ERROR: " + res2.result, "red");
				});
			} else NUT.notify("⚠️ App have no menu!", "yellow");
		});
	}
}
function map_onSelect(evt) {
	if (evt.tool == "toolSelect") {
		var tabconf = NUT.windows[n$.windowid].tabs[0];
		var grid = w2ui["grid_" + tabconf.tabid];
		var where = ["or"];
		for (var i = 0; i < evt.features.length; i++) {
			var feat = evt.features[i];
			var lyrconf = GSMap.getLayerConfig(feat.getId().split(".")[0]);
			if (lyrconf.windowid == n$.windowid) {
				var attr = feat.getProperties();
				var clause = [];
				for (var j = 0; j < tabconf.fields.length; j++) {
					var field = tabconf.fields[j];
					if (field.columndohoa && attr[field.columndohoa]) {
						if (attr[field.columndohoa]) clause.push([field.columndohoa, "=", attr[field.columndohoa]]);
						else { clause = []; break }
					}
				}
				if (clause.length) where.push(clause);
			}
		}
		if (where.length > 1) {
			grid.postData.select = where;
			grid.reload();
		}
	}
}

function menu_onClick(evt) {
	var tag = evt.object.tag;
	if (Number.isInteger(tag)) {
		var appName = Number.isInteger(evt.object.id) ? undefined : evt.object.text;
		var conf = NUT.windows[tag];
		var a = NUT.createWindowTitle(tag, divTitle, appName);
		if (!a) {//already open
			if (appName) {
				var grid = NUT.w2ui["grid_" + conf.tabs[0].tabid];
				grid.box.parentNode.parentNode.tag.tempWhere = evt.object.where;
				grid.reload();
			}
			return;
		}
		var win = new NWin(tag);
		if (conf) {
			conf.tabs[0].tempWhere = evt.object.where;
			win.buildWindow(a.div, conf, 0);
			a.innerHTML = conf.windowname;
		} else {
			NUT.ds.select({ url: NUT.URL + "n_cache", where: ["windowid", "=", tag] }, function (res) {
				if (res.success) {
					var cache = res.result[0];
					if (cache) {
						conf = NUT.configWindow(zipson.parse(cache.configjson), cache.layoutjson?zipson.parse(cache.layoutjson):null);
						conf.tabs[0].tempWhere = evt.object.where;
						conf.tabid = conf.windowid;
						conf.windowname = NUT.translate(conf.translate) || conf.windowname;
						NUT.windows[tag] = conf;
						if (NUT.isObjectEmpty(conf.needCache)) win.buildWindow(a.div, conf, 0);
						else {
							var needCaches = [];
							for (var key in conf.needCache) {
								if (conf.needCache.hasOwnProperty(key) && !NUT.dmlinks[key]) needCaches.push(conf.needCache[key]);
							}
							win.cacheDmAndOpenWin(a.div, conf, needCaches, 0);
						}
						a.innerHTML = appName || conf.windowname;
					} else NUT.notify("⚠️ No cache for window " + tag, "yellow");
				} else NUT.notify("⛔ ERROR: " + res.result, "red");
			});
		}
		if (NUT.isMobile) w2ui["mnuMain"].goFlat();
		n$.windowid = tag;
	} else if (tag.startsWith("https://") || tag.startsWith("http://")) {
		window.open(tag);
	} else if (tag.endsWith(".pdf") || tag.endsWith(".doc") || tag.endsWith(".xls")) {
		window.open("site/" + n$.app.siteid + "/" + n$.app.appid + "/" + tag);
	} else NUT.runComponent(tag);
}