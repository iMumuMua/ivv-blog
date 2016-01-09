在使用PHP的`mysql_set_charset`函数设置字符集为`utf8mb4`时，失败了，并且出现了乱码。
使用`echo mysql_errno() . ": " . mysql_error(). "\n";`输出错误信息，
得到：`2009: Can't initialize character set utf8mb4 (path: /usr/share/mysql/charsets/)`。

网上搜了很久，也在stackoverflow上提问了，依然没有找到好的解决方案。看错误提示，似乎是要修改`/usr/share/mysql/charsets/`里的配置，网上也确实有说过是这样解决的，但是，我连接的可是远程的数据库，并且在另一服务器上没有出现这个问题，所以不想采取这个方法。

*解决问题时，乱试是没有用的，必须根据环境、现象、日志及错误信息等有用信息去分析解决*。所以，既然这个错误信息不能给我提供足够多的有用信息，我就需要自己分析。

首先，我需要确定范围，确定是哪一部分出的问题。两台服务器连同一个数据库，代码一样，那必然就是PHP层出的问题吧。

接着，对比两台服务器的PHP环境，经过分析测试，两台服务器虽然PHP版本不一样，但这并不是原因，我试过在本地搭建了与问题服务器相同版本的PHP环境，依然没有这个问题。再看PHP扩展，它们的区别是，问题服务器的PHP启用的是mysql扩展，并且没有装mysqlnd扩展，正常服务器安装并启用了mysqlnd扩展。

我有点怀疑是扩展问题，但也觉得不太合理，没理由会不支持某一字符集吧。本来想测试在同一机器上这两种扩展的区别，因为某些原因没有成功，于是我决定简单看一下这两个扩展的源代码，看看`mysql_set_charset`这个函数到底做了什么。

经过一翻探索，找到了这个函数的定义：
```c
PHP_FUNCTION(mysql_set_charset)
{
    zval *mysql_link = NULL;
    char *csname;
    int id = -1, csname_len;
    php_mysql_conn *mysql;

    if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "s|r", &csname, &csname_len, &mysql_link) == FAILURE) {
        return;
    }

    if (ZEND_NUM_ARGS() == 1) {
        id = php_mysql_get_default_link(INTERNAL_FUNCTION_PARAM_PASSTHRU);
        CHECK_LINK(id);
    }

    ZEND_FETCH_RESOURCE2(mysql, php_mysql_conn *, &mysql_link, id, "MySQL-Link", le_link, le_plink);

    if (!mysql_set_character_set(mysql->conn, csname)) {
        RETURN_TRUE;
    } else {
        RETURN_FALSE;
    }
}
```

再接着看`mysql_set_character_set`这个函数，发现它和是否启用mysqlnd扩展有关：
```c
#if defined(MYSQL_USE_MYSQLND)
#include "ext/mysqlnd/mysqlnd.h"
#include "mysql_mysqlnd.h"
#else
#include <mysql.h>
#endif
```

再看mysqlnd是如何实现的：
```c
/* {{{ mysqlnd_conn::set_charset */
static enum_func_status
MYSQLND_METHOD(mysqlnd_conn, set_charset)(MYSQLND * const conn, const char * const csname TSRMLS_DC)
{
    enum_func_status ret = PASS;
    char * query;
    size_t query_len;
    const MYSQLND_CHARSET * const charset = mysqlnd_find_charset_name(csname);

    DBG_ENTER("mysqlnd_conn::set_charset");
    DBG_INF_FMT("conn=%llu cs=%s", conn->thread_id, csname);

    if (!charset) {
        SET_CLIENT_ERROR(conn->error_info, CR_CANT_FIND_CHARSET, UNKNOWN_SQLSTATE,
                         "Invalid characterset or character set not supported");
        DBG_RETURN(FAIL);
    }

    query_len = spprintf(&query, 0, "SET NAMES %s", csname);

    if (FAIL == conn->m->query(conn, query, query_len TSRMLS_CC)) {
        php_error_docref(NULL TSRMLS_CC, E_WARNING, "Error executing query");
    } else if (conn->error_info.error_no) {
        ret = FAIL;
    } else {
        conn->charset = charset;
    }
    efree(query); /* allocated by spprintf */

    DBG_INF(ret == PASS? "PASS":"FAIL");
    DBG_RETURN(ret);
}
/* }}} */
```

可以看到，mysqlnd使用了SQL语句`SET NAMES utf8mb4`来设置字符集的。而如果没有使用这个扩展，则会使用`mysql.h`里声明的函数：
```c
int          STDCALL mysql_set_character_set(MYSQL *mysql, const char *csname);
```
这个头文件是放在本地的，安装mysql扩展时需要设置这个路径，我估计，这就是问题服务器失败的原因吧。因为是使用原生的MySQL API，所以我猜测设置字符集时，会从本地路径`/usr/share/mysql/charsets/`读取配置，我查看了这个目录下的字符集配置，果然没有utf8mb4，所以失败，所以有在这个目录下添加这个字符集的描述的解决方案。

通过上面的分析，除了添加描述的解决方案之外，还可以装mysqlnd扩展，并添加配置参数`--with-mysql=mysqlnd`。

当然，还有个更简单的解决方案。既然mysqlnd是用SQL语句`SET NAMES utf8mb4`实现的，那为什么还要使用`mysql_set_charset`这个函数呢？于是，修改为：
`mysql_query('SET NAMES utf8mb4');`，问题就解决了。

