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
        public ResponseJson Gets(String database, bool isSystem=false)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var jsonArr = new List<SchemaJson>();
                    foreach (Schema obj in db.Schemas)
                    {
                        if (obj.IsSystemObject == isSystem)
                        {
                            jsonArr.Add(new SchemaJson
                            {
                                id = obj.ID,
                                name = obj.Name,
                                owner = obj.Owner
                            });
                        }
                    }
                    response.results = jsonArr;
                } else response.results = "Database '" + database + "' not found!";
                return response;

            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, results = ex.Message };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }

        }

        //get Schema info by name
        [HttpGet("{name}")]
        public ResponseJson Get(String database, String name)
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
                        response.results = new SchemaJson
                        {
                            id = obj.ID,
                            name = obj.Name,
                            owner = obj.Owner
                        };

                    }
                    else response.results = "Schema '" + database+"."+name + "' not found!";
                }
                else response.results = "Database '" + database + "' not found!";
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, results = ex.Message };
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
                        response.results = obj.Name;
                    }
                    else response.results = "Schema '" + database + "." + name + "' already exists!";
                }
                else response.results = "Database '" + database + "' not found!";
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, results = ex.Message };
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
                    else response.results = "Schema '" + database + "." + name + "' not found!";
                }
                else response.results = "Database '" + database + "' not found!";
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, results = ex.Message };
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
                    else response.results = "Schema '" + database + "." + name + "' not found!";
                }
                else response.results = "Database '" + database + "' not found!";
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, results = ex.Message };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }
        }
    }
}
