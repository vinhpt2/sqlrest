using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.SqlServer.Management.Common;
using Microsoft.SqlServer.Management.Smo;
using System.Collections;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Security.Claims;
using System.Security.Principal;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace SQLRestC.Controllers
{
    [ApiController]
    [Route(Global.ROOT + "token")]
    public class TokenController : ControllerBase
    {
        //generate token
        [HttpPost("{database}")]
        public ResponseJson Generate(String database, String[] data)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    response.success = (data.Length == 3);
                    if (response.success)
                    {
                        var username = data[0]; var sitecode = data[1]; var password = data[2];
                        var sql = "select * from nv_user_site where username='" + username + "' and sitecode='"+sitecode+"' and password='" + password + "'";

                        using (var ds = db.ExecuteWithResults(sql))
                        {
                            var tbl = ds.Tables[0];
                            response.success = (tbl.Rows.Count == 1);
                            if (response.success)
                            {
                                //get user_site info
                                var row = tbl.Rows[0];
                                var rec = new Dictionary<String, Object>();
                                for (int c = 0; c < row.ItemArray.Length; c++)
                                {
                                    rec.Add(tbl.Columns[c].ColumnName, row[c] is DBNull ? null : row[c]);
                                }
                                
                                var user = new User();
                                user.userid = rec["userid"].ToString();
                                user.siteid = rec["siteid"].ToString();
                                user.columnorg = rec["columnorg"] is DBNull ? null : (String)rec["columnorg"];
                                var sql2 = "select roleid,rolename from n_role where siteid="+user.siteid+" and roleid in(select roleid from n_roleuser where userid=" + user.userid + ") order by seqno";
                                
                                if (user.columnorg!=null) sql2 += ";select orgid,orgname from n_org where siteid=" + user.siteid + " and orgid in(select orgid from n_orguser where userid=" + user.userid + ") order by seqno";
                                using (var ds2 = db.ExecuteWithResults(sql2))
                                {
                                    //role
                                    var tbl2 = ds2.Tables[0];
                                    if(tbl2.Rows.Count == 0)
                                    {
                                        response.success = false;
                                        response.result = "User '" + username + "' has no role!";
                                        return response;
                                    }
                                    var roles = new Dictionary<String,Role>(tbl2.Rows.Count);
                                    for (int i = 0; i < tbl2.Rows.Count; i++)
                                    {
                                        var row2 = tbl2.Rows[i];
                                        roles.Add(row2[0].ToString(), new Role { id = row2[0].ToString(), text = (String)row2[1] });
                                    }
                                    rec.Add("roles", roles);
                                    user.roles = roles;
                                    if (user.columnorg != null)
                                    {
                                        //org
                                        tbl2 = ds2.Tables[1];
                                        var orgs = new Dictionary<String, Org>(tbl2.Rows.Count);
                                        for (int i = 0; i < tbl2.Rows.Count; i++)
                                        {
                                            var row2 = tbl2.Rows[i];
                                            orgs.Add(row2[0].ToString(), new Org { id = row2[0].ToString(), text = (String)row2[1], parentid = row2[2].ToString() });
                                        }
                                        rec.Add("orgs", orgs);
                                        user.orgs = orgs;
                                    }
                                }
                                Global.profiles[user.userid] = user;
                                //gen token
                                var jwtToken = new JwtSecurityToken(
                                    claims:new List<Claim>() { new Claim(ClaimTypes.Name, user.userid) }, 
                                    notBefore: DateTime.UtcNow,
                                    expires: DateTime.UtcNow.AddDays(1),
                                    signingCredentials: new SigningCredentials(
                                        new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Global.jwtkey)), SecurityAlgorithms.HmacSha256Signature)
                                );
                                rec.Add("token", new JwtSecurityTokenHandler().WriteToken(jwtToken));
                                response.result = rec;
                            }
                            else response.result = "User '" + username + "' is not Authorize!";
                        }
                    }
                    else response.result = "No data for [username,sitecode,password]!";
                }
                else response.result = "Database '" + database + "' not found!";
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, result = ex.Message };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }
        }
        //set role & org
        [Authorize]
        [HttpPut("{database}")]
        public ResponseJson SetRoleOrg(String database, String[] data)
        {
            Server server = null;
            try {
                var identity=this.User.Identity.Name;
                var response = new ResponseJson { success = Global.profiles.ContainsKey(identity)  };
                if (response.success)
                {
                    response.success = (data.Length == 2);
                    if (response.success)
                    {
                        String roleid = data[0];String orgid = data[1];
                        var user = Global.profiles[identity];
                    response.success = (user.roles.ContainsKey(roleid));
                        if (response.success)
                        {
                            user.roleid = roleid;
                            response.success = (user.columnorg == null || user.orgs.ContainsKey(orgid));
                            if (response.success)
                            {
                                user.orgwhere = user.columnorg+"="+orgid;
                                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                                var db = server.Databases[database];
                                response.success = (db != null);
                                if (response.success)
                                {
                                    //get access
                                    var sql = "select tablename,noselect,noinsert,noupdate,nodelete,noexport,isarchive,islock from nv_access_table where roleid=" + roleid;
                                    using (var ds = db.ExecuteWithResults(sql))
                                    {
                                        var tbl = ds.Tables[0];
                                        user.access = new Dictionary<String, Access>();
                                        for (int i = 0; i < tbl.Rows.Count; i++)
                                        {
                                            var row = tbl.Rows[i];
                                            user.access[(String)row["tablename"]] = new Access { noselect = (bool)row[1], noinsert = (bool)row[2], noupdate = (bool)row[3], nodelete = (bool)row[4], noexport = (bool)row[5], isarchive = (bool)row[6], islock = (bool)row[7] };
                                        }
                                        response.result = user.access;
                                    }
                                }
                                else response.result = "Database '" + database + "' not found!";
                            }
                            else response.result = "Org " + orgid + " not allow to set!";
                        }
                        else response.result = "Role " +roleid+ " not allow to set!";
                    }
                    else response.result = "No data for [roleid,orgid]!";
                }
                else response.result = "User '" + identity + "' not login yet!";
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, result = ex.Message };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }
        }
    }
}
