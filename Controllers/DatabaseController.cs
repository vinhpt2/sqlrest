using Microsoft.AspNetCore.Mvc;
using Microsoft.SqlServer.Management.Common;
using Microsoft.SqlServer.Management.Smo;
using System.Collections;
using System.IO;

namespace SQLRestC.Controllers
{
    [ApiController]
    [Route(Global.ROOT+"database")]
    public class DatabaseController : ControllerBase
    {
        //list all databases info
        [HttpGet]
        public ResponseJson Gets(bool isSystem=false)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var jsonArr = new List<DatabaseJson>();
                foreach (Database obj in server.Databases)
                {
                    if (obj.IsSystemObject == isSystem)
                    {
                        jsonArr.Add(new DatabaseJson
                        {
                            id = obj.ID,
                            name = obj.Name,
                            createDate = obj.CreateDate,
                            dataUsage = obj.DataSpaceUsage,
                            indexUsage = obj.IndexSpaceUsage
                        });
                    }
                }
                return new ResponseJson { success = true, results = jsonArr };
                
            } catch (Exception ex)
            {
                return new ResponseJson { success = false, results = ex.Message };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }

        }

        //get database info by name
        [HttpGet("{name}")]
        public ResponseJson Get(String name)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var obj = server.Databases[name];
                var response = new ResponseJson { success= (obj != null) };
                if (response.success)
                {
                    response.results = new DatabaseJson
                    {
                        id = obj.ID,
                        name = obj.Name,
                        createDate = obj.CreateDate,
                        dataUsage = obj.DataSpaceUsage,
                        indexUsage = obj.IndexSpaceUsage
                    };
                }
                else response.results = "Database '" + name + "' not found!";
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

        //create database
        [HttpPost("{name}")]
        public ResponseJson Create(String name)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var response = new ResponseJson { success = !server.Databases.Contains(name) };
                if (response.success)
                {
                    var obj = new Database(server, name);
                    obj.Create();
                    response.results = obj.Name;
                } else response.results= "Database '" + name + "' already exists!";
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

        //rename database
        [HttpPut("{name}")]
        public ResponseJson Rename(String name,String newName)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var obj = server.Databases[name];
                var response = new ResponseJson { success = (obj!=null) };
                if (response.success)
                {
                    obj.Rename(newName);
                }
                else response.results = "Database '" + name + "' not exists!";
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

        //drop database
        [HttpDelete("{name}")]
        public ResponseJson Drop(String name)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var obj = server.Databases[name];
                var response = new ResponseJson { success = (obj!=null) };
                if (response.success)
                {
                    obj.Drop();
                }
                else response.results = "Database '" + name + "' not exists!";
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
