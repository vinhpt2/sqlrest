using Microsoft.SqlServer.Management.Smo;
using Newtonsoft.Json.Linq;
using System.Collections;

namespace SQLRestC
{
    public static class Global {
        public static String server;
        public static String username;
        public static String password;
        public const String ROOT = "rest/";
        public const String MS_PATH = "MS_Path";
        public const String MS_DESCRIPTION = "MS_Description";
        public const int LIMIT = 200;
        public static bool safeSqlInjection(String sql)
        {
            return !sql.Contains(";");
        }
        public static String decodeWhere(ArrayList where)
        {
            var decode = "";
            if (where != null)
            {
                var i0 = ("and".Equals(where[0]) || "or".Equals(where[0]) ? 1 : 0);
                var needOpen = (where.Count > i0 + 1);
                if (where[i0] is ArrayList)
                {//array-array
                    if (needOpen) decode += "(";
                    for (var i = i0; i < where.Count; i++)
                    {
                        var subWhere = (ArrayList)where[i];
                        var j0 = ("and".Equals(subWhere[0]) || "or".Equals(subWhere[0]) ? 1 : 0);
                        if (i > i0) decode += ",";
                        if (subWhere[j0] is ArrayList)
                        {//array-array
                            decode += decodeWhere(subWhere);
                        }
                        else
                        {//array
                            var op = subWhere[j0 + 1];
                            var value = subWhere[j0 + 2];
                            decode += subWhere[j0] + ("in".Equals(op) ? " in(" + value + ")" : " " + op + " " + value);
                        }
                    }
                    if (needOpen) decode += ")";
                } else {//array
                    var op = where[i0 + 1];
                    var value = where[i0 + 2];
                    decode += where[i0] + ("in".Equals(op) ? " in(" + value + ")" : " " + op + " " + value);
                }
            }
            return decode;
        }
        //obj can be Table(create new column) or Column(change exists column)
        public static Column makeColumn(ColumnJson col,Object obj){
            var column = (obj is Table ? new Column((Table)obj, col.name) : (Column)obj);
            column.DataType=Global.lookupDataType(col.dataType, col.length, col.precision);
            column.Nullable = col.nullable;
            column.Identity = col.identity;
            if (col.identity)
            {
                column.IdentitySeed = 1;
                column.IdentityIncrement = 1;
            }
            column.Default = col.defaultValue;
            if (col.inPrimaryKey != column.InPrimaryKey)
            {
                var tb = (Table)column.Parent;
                if (col.inPrimaryKey)
                {
                    
                    // create primary key
                    var index = new Microsoft.SqlServer.Management.Smo.Index(tb, "PK_" + tb.Name);
                    index.IndexKeyType = IndexKeyType.DriPrimaryKey;
                    index.IndexedColumns.Add(new IndexedColumn(index, col.name));
                    tb.Indexes.Add(index);
                }
                else tb.Indexes.Remove("PK_" + tb.Name);
            }
            if (col.description != null)
            {
                column.ExtendedProperties.Add(new ExtendedProperty(column, Global.MS_DESCRIPTION, col.description));
            }
            return column;
        }
        //lookup data type by name
        public static DataType lookupDataType(String type, int length, int precision)
        {
            DataType dataType = null;
            switch (type)
            {
                case "bigint":
                    dataType = DataType.BigInt;
                    break;
                case "binary":
                    dataType = DataType.Binary(length);
                    break;
                case "bit":
                    dataType = DataType.Bit;
                    break;
                case "char":
                    dataType = DataType.Char(length);
                    break;
                case "date":
                    dataType = DataType.Date;
                    break;
                case "datetime":
                    dataType = DataType.DateTime;
                    break;
                case "datetime2":
                    dataType = DataType.DateTime2(length);
                    break;
                case "datatimeoffset":
                    dataType = DataType.DateTimeOffset(length);
                    break;
                case "decimal":
                    dataType = DataType.Decimal(length, precision);
                    break;
                case "float":
                    dataType = DataType.Float;
                    break;
                case "geography":
                    dataType = DataType.Geography;
                    break;
                case "geometry":
                    dataType = DataType.Geometry;
                    break;
                case "hierarchyid":
                    dataType = DataType.HierarchyId;
                    break;
                case "image":
                    dataType = DataType.Image;
                    break;
                case "int":
                    dataType = DataType.Int;
                    break;
                case "money":
                    dataType = DataType.Money;
                    break;
                case "nchar":
                    dataType = DataType.NChar(length);
                    break;
                case "ntext":
                    dataType = DataType.NText;
                    break;
                case "numeric":
                    dataType = DataType.Numeric(length, precision);
                    break;
                case "nvarchar":
                    dataType = DataType.NVarChar(length);
                    break;
                case "nvarcharmax":
                    dataType = DataType.NVarCharMax;
                    break;
                case "real":
                    dataType = DataType.Real;
                    break;
                case "smalldatetime":
                    dataType = DataType.SmallDateTime;
                    break;
                case "smallint":
                    dataType = DataType.SmallInt;
                    break;
                case "smallmoney":
                    dataType = DataType.SmallMoney;
                    break;
                case "sysname":
                    dataType = DataType.SysName;
                    break;
                case "text":
                    dataType = DataType.Text;
                    break;
                case "time":
                    dataType = DataType.Time(length);
                    break;
                case "timestamp":
                    dataType = DataType.Timestamp;
                    break;
                case "tinyint":
                    dataType = DataType.TinyInt;
                    break;
                case "uniqueidentifier":
                    dataType = DataType.UniqueIdentifier;
                    break;
                case "varbinary":
                    dataType = DataType.VarBinary(length);
                    break;
                case "varbinarymax":
                    dataType = DataType.VarBinaryMax;
                    break;
                case "varchar":
                    dataType = DataType.VarChar(length);
                    break;
                case "varcharmax":
                    dataType = DataType.VarCharMax;
                    break;
                case "variant":
                    dataType = DataType.Variant;
                    break;
            }
            return dataType;
        }
    }

    public class ResponseJson
    {
        public bool success { get; set; }
        public Object result { get; set; }
        public int total { get; set; }
    }

    public class QueryJson
    {
        public String select { get; set; }
        public String? where { get; set; }
        public String? groupby { get; set; }
        public String? having { get; set; }
        public String? orderby { get; set; }
        public int? offset { get; set; }
        public int? limit { get; set; }
    }

    public class DatabaseJson
    {
        public int id { get; set; }
        public String name { get; set; }
        public DateTime createDate { get; set; }
        public double dataUsage { get; set; }
        public double indexUsage { get; set; }
    }

    public class SchemaJson
    {
        public int id { get; set; }
        public String name { get; set; }
        public String owner { get; set; }
    }

    public class TableJson
    {
        public int id { get; set; }
        public String name { get; set; }
        public DateTime createDate { get; set; }
        public double dataUsage { get; set; }
        public double indexUsage { get; set; }
        public String path { get; set; }
    }

    public class ColumnJson
    {
        public int id { get; set; }
        public String name { get; set; }
        public String dataType { get; set; }
        public int length { get; set; }
        public int precision { get; set; }
        public bool nullable { get; set; }
        public bool inPrimaryKey { get; set; }
        public bool identity { get; set; }
        public String defaultValue { get; set; }
        public String description { get; set; }
    }
}
