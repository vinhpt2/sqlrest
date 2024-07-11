using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.SqlServer.Management.Common;
using Microsoft.SqlServer.Management.Smo;
using System.Collections;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Security.Claims;
using System.Text;
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
                    response.success = (data.Length == 2);
                    if (response.success)
                    {
                        var user = data[0];var pass = data[1];
                        var sql = "select * from nv_user_site where username='" + user + "' and password='" + pass + "'";

                        using (var ds = db.ExecuteWithResults(sql))
                        {
                            var tbl = ds.Tables[0];
                            response.success = (tbl.Rows.Count == 1);
                            if (response.success)
                            {
                                //gen token
                                var claims = new List<Claim> { new Claim(ClaimTypes.Name, user) };
                                var jwtToken = new JwtSecurityToken(
                                    claims: claims,
                                    notBefore: DateTime.UtcNow,
                                    expires: DateTime.UtcNow.AddDays(1),
                                    signingCredentials: new SigningCredentials(
                                        new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Global.jwtkey)), SecurityAlgorithms.HmacSha256Signature)
                                );
                                //get user_site info
                                var row = tbl.Rows[0];
                                var rec = new Dictionary<String, Object>();
                                for (int c = 0; c < row.ItemArray.Length; c++)
                                {
                                    rec.Add(tbl.Columns[c].ColumnName, row[c] is DBNull ? null : row[c]);
                                }
                                rec.Add("token", new JwtSecurityTokenHandler().WriteToken(jwtToken));
                                response.result = rec;
                            }
                            else response.result = "User '" + user + "' is not Authorize!";
                        }
                    }
                    else response.result = "No data for [user,pass]!";
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
    }
}
