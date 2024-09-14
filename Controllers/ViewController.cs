using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.SqlServer.Management.Common;
using Microsoft.SqlServer.Management.Smo;
using System.Collections;
using System.IO;

namespace SQLRestC.Controllers
{
    [Authorize]
    [ApiController]
    [Route(Global.ROOT+"{database}/{schema}/view")]
    public class ViewController : ControllerBase
    {
        //list all Table info
        [HttpGet]
        public ResponseJson GetAll(String database, String schema,bool detail = false)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[(String)database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    response.success= db.Schemas.Contains(schema);
                    if (response.success)
                    {
                        response.result = Global.getViewInfo(db,schema, detail);
                    }else response.result = "Schema '" + database+"."+schema + "' not found!";
                } else response.result = "Database '" + database + "' not found!";
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

        //get Table info by name
        [HttpGet("{name}")]
        public ResponseJson Get(String database, String schema, String name,bool detail = false)
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
                        var obj = db.Views[name, schema];
                        response.success=(obj!=null);
                        if (response.success)
                        {
                            response.result = new ViewJson
                            {
                                id = obj.ID,
                                name = obj.Name,
                                columns = (detail ? Global.getColumnInfo(obj.Columns) : null),
                                path = obj.ExtendedProperties.Contains(Global.MS_PATH) ? (String)obj.ExtendedProperties[Global.MS_PATH].Value : null,
                                alias = obj.ExtendedProperties.Contains(Global.MS_ALIAS) ? (String)obj.ExtendedProperties[Global.MS_ALIAS].Value : null
                            };
                        }
                        else response.result = "View '" + database + "."+schema + "." + name + "' not found!";
                    }
                    else response.result = "Schema '" + database+"."+name + "' not found!";
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

        //create View
        [HttpPost("{name}")]
        public ResponseJson Create(String database,String schema, String name, String sql, String path=null)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    response.success = !db.Views.Contains(name,schema);
                    if (response.success)
                    {
                        var obj = new View(db, name,schema);
                        //obj.TextHeader = "CREATE VIEW " + schema + "." + name+" AS";
                        obj.TextBody = sql;
                        obj.Create();
                        if (!String.IsNullOrEmpty(path))
                        {
                            obj.ExtendedProperties.Add(new ExtendedProperty(obj, Global.MS_PATH, path));
                        }
                        response.result = obj.ID;
                    }
                    else response.result = "View '" + database + "."+schema+"." + name + "' already exists!";
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

        //rename View
        [HttpPut("{name}")]
        public ResponseJson Rename(String database, String schema, String name, String newName, String newPath=null)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var obj = db.Views[name,schema];
                    response.success = (obj != null);
                    if (response.success)
                    {
                        obj.Rename(newName);
                        if (!String.IsNullOrEmpty(newPath))
                        {
                            var prop = obj.ExtendedProperties[Global.MS_PATH];
                            if(prop == null)
                                obj.ExtendedProperties.Add(new ExtendedProperty(obj, Global.MS_PATH, newPath));
                            else
                                prop.Value = newPath;
                        }
                    }
                    else response.result = "View '" + database+ "." +schema+ "." + name + "' not found!";
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

        //drop View
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
                    var obj = db.Views[name,schema];
                    response.success = (obj != null);
                    if (response.success)
                    {
                        obj.Drop();
                    }
                    else response.result = "View '" + database+"."+schema + "." + name + "' not found!";
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
