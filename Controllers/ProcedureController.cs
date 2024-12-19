using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.SqlServer.Management.Common;
using Microsoft.SqlServer.Management.Smo;
using System.Collections;
using System.Collections.Generic;
using System.IO;

namespace SQLRestC.Controllers
{
    [Authorize]
    [ApiController]
    [Route(Global.ROOT + "{database}/{schema}/procedure")]
    public class ProcedureController : ControllerBase
    {
        //list all Procedure info
        [HttpGet]
        public ResponseJson GetAll(String database, String schema, bool detail = false)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[(String)database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    response.success = db.Schemas.Contains(schema);
                    if (response.success)
                    {
                        response.result = Global.getProcedureInfo(db, schema, detail);
                    }
                    else response.result = "Schema '" + database + "." + schema + "' not found!";
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

        //get Procedure info by name
        [HttpGet("{name}")]
        public ResponseJson Get(String database, String schema, String name, bool detail = false)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[(String)database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    response.success = db.Schemas.Contains(schema);
                    if (response.success)
                    {
                        var obj = db.StoredProcedures[name, schema];
                        response.success = (obj != null);
                        if (response.success)
                        {
                            response.result = new ProcedureJson
                            {
                                id = obj.ID,
                                name = obj.Name,
                                path = obj.ExtendedProperties.Contains(Global.MS_PATH) ? (String)obj.ExtendedProperties[Global.MS_PATH].Value : null,
                                alias = obj.ExtendedProperties.Contains(Global.MS_ALIAS) ? (String)obj.ExtendedProperties[Global.MS_ALIAS].Value : null
                            };
                        }
                        else response.result = "Procedure '" + database + "." + schema + "." + name + "' not found!";
                    }
                    else response.result = "Schema '" + database + "." + name + "' not found!";
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

        //execute Procedure
        [HttpPost("{name}/{param}")]
        public ResponseJson Execute(String database, String schema, String name, String? param)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var obj = db.StoredProcedures[name, schema];
                    response.success = (obj != null);
                    if (response.success)
                    {
                        var sql = "Exec "+obj.Name+" " + param;
                        response.success = Global.safeSqlInjection(sql);
                        if (response.success)
                        {
                            using (var ds = db.ExecuteWithResults(sql))
                            {
                                var tbl = ds.Tables[0];
                                var rs = new Dictionary<String, Object>[tbl.Rows.Count];
                                for (int r = 0; r < rs.Length; r++)
                                {
                                    var row = tbl.Rows[r];
                                    var rec = new Dictionary<String, Object>();
                                    for (int c = 0; c < row.ItemArray.Length; c++)
                                    {
                                        rec.Add(tbl.Columns[c].ColumnName, row[c] is DBNull ? null : row[c]);
                                    }
                                    rs[r] = rec;
                                }
                                response.result = rs;
                            }
                        }
                        else response.result = "SQL INJECTION FOUND! Not safe to executes.";
                    }
                    else response.result = "Procedure '" + database + "." + schema + "." + name + "' not found!";
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
        //create Procedure
        [HttpPost("{name}")]
        public ResponseJson Create(String database, String schema, String name, SqlJson json, String? path)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    response.success = !db.StoredProcedures.Contains(name, schema);
                    if (response.success)
                    {
                        var obj = new StoredProcedure(db, name, schema);
                        obj.TextHeader = "CREATE PROCEDURE " + schema + "." + name + " AS";
                        obj.TextBody = json.sql;
                        obj.Create();
                        if (!String.IsNullOrEmpty(path))
                        {
                            obj.ExtendedProperties.Add(new ExtendedProperty(obj, Global.MS_PATH, path));
                        }
                        response.result = obj.ID;
                    }
                    else response.result = "Procedure '" + database + "." + schema + "." + name + "' already exists!";
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

        //rename Procedure
        [HttpPut("{name}")]
        public ResponseJson Rename(String database, String schema, String name, String newName, String? newPath)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var obj = db.StoredProcedures[name, schema];
                    response.success = (obj != null);
                    if (response.success)
                    {
                        obj.Rename(newName);
                        if (!String.IsNullOrEmpty(newPath))
                        {
                            var prop = obj.ExtendedProperties[Global.MS_PATH];
                            if (prop == null)
                                obj.ExtendedProperties.Add(new ExtendedProperty(obj, Global.MS_PATH, newPath));
                            else
                                prop.Value = newPath;
                        }
                    }
                    else response.result = "Procedure '" + database + "." + schema + "." + name + "' not found!";
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

        //drop Procedure
        [HttpDelete("{name}")]
        public ResponseJson Drop(String database, String schema, String name)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var obj = db.StoredProcedures[name, schema];
                    response.success = (obj != null);
                    if (response.success)
                    {
                        obj.Drop();
                    }
                    else response.result = "Procedure '" + database + "." + schema + "." + name + "' not found!";
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
