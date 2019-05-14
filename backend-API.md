## 所有消息格式

与server之间通信的数据格式

```json
{
    "type": string,
    "data": any 
}
```

type取值如下：

| 字段名               | 备注                        |
| -------------------- | --------------------------- |
| Login                | 登录：client->server        |
| Room list            | 房间列表：server->client    |
| Enter room           | 进入房间：client->server    |
| Synchronization data | 同步数据：client<->server   |
| Error                | 错误信息：server->client    |
| Message              | 所有非上述字段都使用message |



用于客户端间同步的数据格式

```json
{
    "state": "insert" | "remove",
    "roads": [
        {
            "from": THREE.Vector2,
            "to": THREE.Vector2,
            "width": number
        },
        ...
    ],
    "buildings": [
        {
            "prototype": string, // 楼原型名称
            "center": THREE.Vector2
        },
		...
    ]
}
```



## 登陆

客户端向服务器发送的登陆请求消息体中，type为"Login"，data为密码和用户名。

```json
{
    "type": "Login",
    "data": {
        "user": string
        "pwd": string
    }
}
```

服务器收到请求并解析后，返回房间信息消息体，其中，type为"Room List"，data为房间编号，格式如下：

```json
{
	"type": "Room list",
    "data": [
        {
        	"room": number,
            "players":[
                "name": ,
                "name": ,
                ...
            ]
		},
        ...
	]
}
```



## 进入房间

客户端向服务器发送的请求中，type为"Room Choose"，data为房间号

```json
{
    "type": "Enter room",
    "data": {
        "room":number // 房间序号
    }
}
```

服务器返回的消息体中，type为"Room Synchronization"， data为当前该房间的bashmap json数据

```json
{
	"type":"Synchronization data",
    "data": {...} // 参考上文
}
```

若所选择的房间号服务器不支持，服务器会返回type为"Error" 的消息，data为错误信息

```json
{
	"type": "Error",
	"data": {
        "info": string // error info
    }
}
```

## 游戏中

客户端向服务器发送的消息type为"Game Info"，data为相关数据

```json
{
    "type": "Synchronization data",
    "data": {...} // 参考上文
}
```

服务器收到后会向发送客户端返回消息type为"Info"，data为"Data Received" 的确认信息，然后给该房间中其余客户端发送type为"Game Info"， data为相关数据的转发数据。

```json
// 被同步的客户端
{
    "type": "Message",
    "data": {
     	"info": "Data Received"   
    }
}
// 其他客户端
{
    "type": "Synchronization data",
    "data": {...} // 参考上文
}

```

客户端同步成功后，应当发送信息通知server

```json
{
    "type": "Message",
    "data": {
        "info": "Synchronization success"
    } 
}

```

**注意：**若客户端同步失败或者出于其他原因，可能会以如下格式向服务器发送重新获取数据的请求

```json
{
    "type": "Message",
    "data": {
        "info": "Request synchronization"
    } 
}

```

则服务器需要对此客户端重新发送同步数据。也就意味着服务器上要维护一个最新同步数据的副本。



## 退出登陆

(一次性退出房间以及游戏大厅)

客户端向服务器发送消息，要求客户端退出

```json
{
    "type": "Message",
    "data": {
  		  "info": "Log out"
	} 
}

```

服务器确认后，会返回确认消息

```json
{
    "type": "Message",
    "data": {
  		  "info": "Log out confirmed"
	} 
}

```

##Ts 服务器

ts服务器向Java服务器反馈判断检查结果

```json
{
    "type": "Message",
    "data": {
            "info": "State check",
            "valid": "true" | "false",
            "roads": [
                {
                    "from": THREE.Vector2,
                    "to": THREE.Vector2,
                    "width": number
                },
                ...
            ],
            "buildings": [
                {
                    "prototype": string, // 楼原型名称
                    "center": THREE.Vector2
                },
                ...
            ]
	} 
}
```

Java 服务器在房间加入事件中向ts请求数据

```json
{
    "type": "Message",
    "data": {
        "info": "Data required"
    }
}
```

ts服务器返回房间数据

```json
{
    "type": "Message",
    "data": {
            "info": "Room data",
            "roads": [
                {
                    "from": THREE.Vector2,
                    "to": THREE.Vector2,
                    "width": number
                },
                ...
            ],
            "buildings": [
                {
                    "prototype": string, // 楼原型名称
                    "center": THREE.Vector2
                },
                ...
            ]
	} 
}
```