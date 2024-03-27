using Microsoft.AspNetCore.Mvc;
using Microsoft.SqlServer.Management.Common;
using Microsoft.SqlServer.Management.Smo;
using System;
using System.Collections;

namespace SQLRestC.Controllers
{
    [ApiController]
    [Route(Global.ROOT+ "{database}/{schema}/column/{table}")]
    public class ColumnController : ControllerBase
    {
        //list all Table info
        [HttpGet]
        public ResponseJson Gets(String database, String schema, String table)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var tb = db.Tables[table, schema];
                    response.success = (tb!=null);
                    if (response.success)
                    {
                        var jsonArr = new List<ColumnJson>();
                        foreach (Column obj in tb.Columns)
                        {
                            jsonArr.Add(new ColumnJson
                            {
                                id = obj.ID,
                                name = obj.Name,
                                dataType = obj.DataType.Name,
                                length = (obj.DataType.IsNumericType? obj.DataType.NumericScale:obj.DataType.MaximumLength),
                                precision = obj.DataType.NumericPrecision,
                                nullable=obj.Nullable,
                                inPrimaryKey=obj.InPrimaryKey,
                                identity=obj.Identity,
                                defaultValue=obj.Default,
                                description = obj.ExtendedProperties.Contains(Global.MS_DESCRIPTION) ? (String)obj.ExtendedProperties[Global.MS_DESCRIPTION].Value : null
                            });
                        }
                        response.results = jsonArr;
                    }
                    else response.results = "Table '" + database + "." + schema+"."+table + "' not found!";
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

        //get Table info by name
        [HttpGet("{name}")]
        public ResponseJson Get(String database, String schema, String table, String name)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var tb = db.Tables[table, schema];
                    response.success = (tb != null);
                    if (response.success)
                    {
                        var obj = tb.Columns[name];
                        response.success = (obj != null);
                        if (response.success)
                        {
                            response.results = new ColumnJson
                            {
                                id = obj.ID,
                                name = obj.Name,
                                dataType = obj.DataType.Name,
                                length = (obj.DataType.IsNumericType ? obj.DataType.NumericScale : obj.DataType.MaximumLength),
                                precision = obj.DataType.NumericPrecision,
                                nullable = obj.Nullable,
                                inPrimaryKey = obj.InPrimaryKey,
                                identity = obj.Identity,
                                defaultValue = obj.Default,
                                description = obj.ExtendedProperties.Contains(Global.MS_DESCRIPTION) ? (String)obj.ExtendedProperties[Global.MS_DESCRIPTION].Value : null
                            };
                        }
                        else response.results = "Column '" + database + "." + schema + "."+table + "." + name + "' not found!";
                    }
                    else response.results = "Table '" + database + "." + schema + "." + table + "' not found!";
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

        //alter table's Columns by column name (~)
        //add new if column name not exists (+)
        //delete if data type = null (-)
        [HttpPost("{name}")]
        public ResponseJson Alters(String database, String schema, String table, String name, List<ColumnJson> columns)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var tb = new Table(db, table, schema);
                    response.success = (tb!=null);
                    if (response.success)
                    {
                        var nameArr = new String[columns.Count];
                        for (int i= 0;i<columns.Count;i++)
                        {
                            var col = columns[i];
                            var column = String.IsNullOrEmpty(col.dataType)?null: Global.makeColumn(col, tb);
                            bool isAddNew = !tb.Columns.Contains(col.name);
                            if (isAddNew)//add new
                            {
                                tb.Columns.Add(column);
                            }
                            else//delete or change
                            {
                                tb.Columns.Remove(col.name);
                                if (column != null)tb.Columns.Add(column);
                            }
                            nameArr[i]=col.name+(isAddNew?"+":(column==null?"-":"~"));
                        }
                        tb.Alter();

                        response.results = nameArr;
                    }
                    else response.results = "Table '" + database + "." + schema + "." + table + "' not found!";
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

        //edit column
        [HttpPut("{name}")]
        public ResponseJson Edit(String database, String schema, String table, String name, ColumnJson column)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var tb = new Table(db, table, schema);
                    response.success = (tb != null);
                    if (response.success)
                    {
                        var obj = tb.Columns[column.name];
                        response.success = (obj != null);
                        if (response.success)
                        {
                            Global.makeColumn(column, obj);
                            obj.Alter();
                        }
                        else response.results = "Column '" + database + "." + schema + "."+table+"." + name + "' not found!";
                    }
                    else response.results = "Table '" + database + "." + schema + "." + table + "' not found!";
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

        //delete Column
        [HttpDelete("{name}")]
        public ResponseJson Drop(String database, String schema, String table, String name)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    var tb = db.Tables[table, schema];
                    response.success = (tb != null);
                    if (response.success)
                    {
                        var obj = tb.Columns[name];
                        response.success = (obj != null);
                        if (response.success)
                        {
                            obj.Drop();
                        }
                        else response.results = "Column '" + database + "." + schema + "."+table+"." + name + "' not found!";
                    }
                    else response.results = "Table '" + database + "." + schema + "." + name + "' not found!";
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
