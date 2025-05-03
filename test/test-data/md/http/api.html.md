# endpoint list

[ADMIN_EDITOR_GET](#admin_editor_get)

	ADMIN EDITOR GUI

[ADMIN_EDITOR_API_FS_DELETE_POST](#admin_editor_api_fs_delete_post)

	admin editor file deletion endpoint

[ADMIN_EDITOR_API_FS_READ_POST](#admin_editor_api_fs_read_post)

	admin editor file read endpoint

[ADMIN_EDITOR_API_FS_RENAME_POST](#admin_editor_api_fs_rename_post)

	admin editor file rename endpoint

[ADMIN_EDITOR_API_FS_SCAN_GET](#admin_editor_api_fs_scan_get)

	admin editor file scan endpoint

[ADMIN_EDITOR_API_FS_WRITE_POST](#admin_editor_api_fs_write_post)

	admin editor file write endpoint

[ADMIN_EDITOR_API_SERVER_RELOAD_POST](#admin_editor_api_server_reload_post)

	admin editor server reload endpoint. reloads the server without closing the port

[ADMIN_EDITOR_API_SERVER_RESTART_POST](#admin_editor_api_server_restart_post)

	admin editor server restart endpoint

# endoints

## ADMIN_EDITOR_GET

ADMIN EDITOR GUI

[get] /admin/editor/

## ADMIN_EDITOR_API_FS_DELETE_POST

admin editor file deletion endpoint

[post] /admin/editor/api/fs/delete/

### request

#### body

| | | | | | 
|--------|-------|-------|-|-|
| path | string|


### response

#### status

200,400

#### body

| | | | | | 
|--------|-------|-------|-|-|
| message | string|


## ADMIN_EDITOR_API_FS_READ_POST

admin editor file read endpoint

[post] /admin/editor/api/fs/read/

### request

#### body

| | | | | | 
|--------|-------|-------|-|-|
| path | string|


### response

#### status

200,400

#### body

| | | | | | 
|--------|-------|-------|-|-|
| contents | string|
| path | string|


## ADMIN_EDITOR_API_FS_RENAME_POST

admin editor file rename endpoint

[post] /admin/editor/api/fs/rename/

### request

#### body

| | | | | | 
|--------|-------|-------|-|-|
| path | string|
| newName | string|


### response

#### status

200,400

#### body

| | | | | | 
|--------|-------|-------|-|-|
| message | string|


## ADMIN_EDITOR_API_FS_SCAN_GET

admin editor file scan endpoint

[get] /admin/editor/api/fs/scan/

### response

#### status

200,400

## ADMIN_EDITOR_API_FS_WRITE_POST

admin editor file write endpoint

[post] /admin/editor/api/fs/write/

### request

#### body

| | | | | | 
|--------|-------|-------|-|-|
| path | string|
| contents | string|
| override | boolean?|


### response

#### status

200,400

#### body

| | | | | | 
|--------|-------|-------|-|-|
| message | string|


## ADMIN_EDITOR_API_SERVER_RELOAD_POST

admin editor server reload endpoint. reloads the server without closing the port

[post] /admin/editor/api/server/reload/

### response

#### status

200,400

#### body

| | | | | | | | | | 
|--------|-------|-------|-|-|-|-|-|-|
| message | string|
| reloadString | string|
| migrations | string[]|
| errors | Array\<object\>| |
| | | filePath | string|
| | | error | string|


## ADMIN_EDITOR_API_SERVER_RESTART_POST

admin editor server restart endpoint

[post] /admin/editor/api/server/restart/

### response

#### status

200,400

#### body

| | | | | | | | | | 
|--------|-------|-------|-|-|-|-|-|-|
| message | string|
| reloadString | string|
| migrations | string[]|
| errors | Array\<object\>| |
| | | filePath | string|
| | | error | string|


