using Microsoft.AspNetCore.Mvc;
using Microsoft.SqlServer.Management.Common;
using Microsoft.SqlServer.Management.Smo;
using System.Collections;
using System.IO;

namespace SQLRestC.Controllers
{
    [ApiController]
    [Route(Global.ROOT+"{database}/schema")]
    public class SchemaController : ControllerBase
    {
        //list all Schema info
        [HttpGet]
        public ResponseJson GetAll(String database, bool detail = false, bool system=false)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    response.result = Global.getSchemaInfo(db, detail, system);
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

        //get Schema info by name
        [HttpGet("{name}")]
        public ResponseJson Get(String database, String name,bool detail = false)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var obj = db.Schemas[name];
                    response.success = (obj != null);
                    if (response.success)
                    {
                        response.result = new SchemaJson
                        {
                            id = obj.ID,
                            name = obj.Name,
                            owner = obj.Owner,
                            tables = detail ? Global.getTableInfo(db, obj.Name, obj.IsSystemObject) : null,
                            views = detail ? Global.getViewInfo(db, obj.Name, obj.IsSystemObject) : null
                        };
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

        //create Schema
        [HttpPost("{name}")]
        public ResponseJson Create(String database, String name)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    response.success = !db.Schemas.Contains(name);
                    if (response.success)
                    {
                        var obj = new Schema(db, name);
                        obj.Create();
                        response.result = obj.Name;
                    }
                    else response.result = "Schema '" + database + "." + name + "' already exists!";
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

        //rename Schema
        [HttpPut("{name}")]
        public ResponseJson Rename(String database, String name, String newName)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var obj = db.Schemas[name];
                    response.success = (obj != null);
                    if (response.success)
                    {
                        obj.Name= newName;
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

        //drop Schema
        [HttpDelete("{name}")]
        public ResponseJson Drop(String database, String name)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var obj = db.Schemas[name];
                    response.success = (obj != null);
                    if (response.success)
                    {
                        obj.Drop();
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
    }
}
