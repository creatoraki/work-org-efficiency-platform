/\*\*

- 下载文件
- @param {string} bucketName
- @param {string} fileName
- @returns
  \*/
  export function download(bucketName, fileName) {
  return request.get(`/shanshu-efficiency-api/file/oss/download?bucketName=${bucketName}&fileName=${fileName}`);
  }

// Response interface
export interface DownloadRes {}

/\*\*

- 下载文件
- @param {string} bucketName
- @param {string} fileName
- @returns
  \*/
  export function download(bucketName: string, fileName: string): Promise<DownloadRes> {
  return request.get(`/shanshu-efficiency-api/file/oss/download?bucketName=${bucketName}&fileName=${fileName}`);
  }

/\*\*

- 导出通用接口(使用当前系统的token)
- @param {object} params excel数据导出--form
- @param {number} params.excelId 模板id
- @param {object} params.reqCondition 查询条件map<字段名，值>
- @param {array} params.exportTableHead 若表头较特殊没办法从接口以及数据库维护中获取，则需要上传
- @returns
  \*/
  export function commonExport(params, params) {
  return request.post(`/shanshu-efficiency-api/excel/common/export`, params, params);
  }

// Parameter interface

// Response interface
export interface CommonExportRes {
/_返回码 _/
code: number;

/_返回码说明 _/
msg: string;

/_返回数据 _/
data: boolean;
}

/\*\*

- 导出通用接口(使用当前系统的token)
- @param {object} params excel数据导出--form
- @param {number} params.excelId 模板id
- @param {object} params.reqCondition 查询条件map<字段名，值>
- @param {array} params.exportTableHead 若表头较特殊没办法从接口以及数据库维护中获取，则需要上传
- @returns
  \*/
  export function commonExport(params: CommonExportParams, params: CommonExportParams): Promise<CommonExportRes> {
  return request.post(`/shanshu-efficiency-api/excel/common/export`, params, params);
  }

/\*\*

- 文件导出信息表分页查询
- @param {object} params (分页)-query
- @param {number} params.pageNum 页码(不能为空)
- @param {number} params.pageSize 每页数量(不能为空)
- @param {boolean} params.searchCount 是否查询总条数
- @param {array} params.sortItemList 排序字段集合
- @param {string} params.name
- @param {string} params.module
- @param {number} params.status
- @param {object} params.startDate
- @param {object} params.endDate
- @returns
  \*/
  export function page_9(params) {
  return request.post(`/shanshu-efficiency-api/file/info`, params);
  }

// Parameter interface
export interface Page*9Params {
/*页码(不能为空) \_/
pageNum: number;

/_每页数量(不能为空) _/
pageSize: number;

/_是否查询总条数 _/
searchCount?: boolean;

/_排序字段集合 _/
sortItemList?: {
/_true正序|false倒序 _/
isAsc: boolean;

    /*排序字段 */
    column: string;

}[];

/\* \*/
name?: string;

/\* \*/
module?: string;

/\* \*/
status?: number;

/\* \*/
startDate?: Record<string, unknown>;

/\* \*/
endDate?: Record<string, unknown>;
}

// Response interface
export interface Page*9Res {
/*返回码 \_/
code: number;

/_返回码说明 _/
msg: string;

/_返回数据 _/
data: {
/_当前页 _/
pageNum: number;

    /*每页的数量 */
    pageSize: number;

    /*总记录数 */
    total: number;

    /*总页数 */
    pages: number;

    /*结果集 */
    list: {
      /*主键 */
      id: number;

      /*文件名称 */
      name: string;

      /*模块名称 */
      module: string;

      /*文件大小（kb） */
      fileSize: Record<string, unknown>;

      /*状态。 -1：导出失败，0：取消，1：排队中，2：导出中，3：导出完成 */
      status: number;

      /*状态。 -1：导出失败，0：取消，1：排队中，2：导出中，3：导出完成 */
      statusStr: string;

      /*进度 */
      progress: string;

      /*备注 */
      remark: string;

      /*桶名称 */
      bucketName: string;
    }[];

    /*是否为空 */
    emptyFlag: boolean;

};
}

/\*\*

- 文件导出信息表分页查询
- @param {object} params (分页)-query
- @param {number} params.pageNum 页码(不能为空)
- @param {number} params.pageSize 每页数量(不能为空)
- @param {boolean} params.searchCount 是否查询总条数
- @param {array} params.sortItemList 排序字段集合
- @param {string} params.name
- @param {string} params.module
- @param {number} params.status
- @param {object} params.startDate
- @param {object} params.endDate
- @returns
  \*/
  export function page_9(params: Page_9Params): Promise<Page_9Res> {
  return request.post(`/shanshu-efficiency-api/file/info`, params);
  }

/\*\*

- 取消导出
- @param {string} id
- @returns
  \*/
  export function cancelById(id) {
  return request.put(`/shanshu-efficiency-api/file/info/cancel/${id}`);
  }

// Response interface
export interface CancelByIdRes {
/_返回码 _/
code: number;

/_返回码说明 _/
msg: string;

/_返回数据 _/
data: boolean;
}

/\*\*

- 取消导出
- @param {string} id
- @returns
  \*/
  export function cancelById(id: number): Promise<CancelByIdRes> {
  return request.put(`/shanshu-efficiency-api/file/info/cancel/${id}`);
  }

/\*\*

- excel配置分页界面
- @param {object} params PageParam
- @param {number} params.pageNum 页码(不能为空)
- @param {number} params.pageSize 每页数量(不能为空)
- @param {boolean} params.searchCount 是否查询总条数
- @param {array} params.sortItemList 排序字段集合
- @returns
  \*/
  export function page(params) {
  return request.post(`/shanshu-efficiency-api/common/export/config`, params);
  }

// Parameter interface
export interface PageParams {
/_页码(不能为空) _/
pageNum: number;

/_每页数量(不能为空) _/
pageSize: number;

/_是否查询总条数 _/
searchCount?: boolean;

/_排序字段集合 _/
sortItemList?: {
/_true正序|false倒序 _/
isAsc: boolean;

    /*排序字段 */
    column: string;

}[];
}

// Response interface
export interface PageRes {
/_返回码 _/
code: number;

/_返回码说明 _/
msg: string;

/_返回数据 _/
data: {
/_当前页 _/
pageNum: number;

    /*每页的数量 */
    pageSize: number;

    /*总记录数 */
    total: number;

    /*总页数 */
    pages: number;

    /*结果集 */
    list: {
      /*主键ID */
      id: number;

      /*ExcelId */
      excelId: number;

      /*Excel文件名称 */
      fileName: string;

      /*模块名称 */
      module: string;

      /*数据请求地址 */
      dataReqUrl: string;

      /*请求结构（JSON格式） */
      queryStructure: {
        /*分页页码字段名map<字段名，数量> */
        pageNumMap: Record<string, unknown>;

        /*分页字段一页数据量字段名map<字段名，数量> */
        pageSizeMap: Record<string, unknown>;

        /*分页字段查询结果数量字段map<字段名，数量> */
        countMap: Record<string, unknown>;
      };

      /*返回结构（JSON格式） */
      resultStructure: {
        /*统计字段所在全路劲 */
        totalNumPath: Record<string, unknown>[];

        /*数据所在全路劲 */
        dataPath: Record<string, unknown>[];
      };

      /*导出表头列表（JSON数组） */
      exportTableHead: Record<string, unknown>[];

      /*导出顶级表头（JSON二维数组） */
      topHeaders: Record<string, unknown>[];

      /*创建时间 */
      createTime: Record<string, unknown>;
    }[];

    /*是否为空 */
    emptyFlag: boolean;

};
}

/\*\*

- excel配置分页界面
- @param {object} params PageParam
- @param {number} params.pageNum 页码(不能为空)
- @param {number} params.pageSize 每页数量(不能为空)
- @param {boolean} params.searchCount 是否查询总条数
- @param {array} params.sortItemList 排序字段集合
- @returns
  \*/
  export function page(params: PageParams): Promise<PageRes> {
  return request.post(`/shanshu-efficiency-api/common/export/config`, params);
  }

/\*\*

- 修改excel规则
- @param {object} params 通用导出配置表
- @param {string} params.delFlag 删除标志
- @param {string} params.createBy 创建者
- @param {string} params.createByName 创建者
- @param {string} params.updateBy 更新者
- @param {string} params.updateByName 更新者
- @param {object} params.createTime 创建时间
- @param {object} params.updateTime 更新时间
- @param {number} params.id 主键ID
- @param {number} params.excelId ExcelId
- @param {string} params.fileName Excel文件名称
- @param {string} params.module 模块名称
- @param {string} params.dataReqUrl 数据请求地址
- @param {object} params.queryStructure 请求结构（JSON格式）
- @param {object} params.resultStructure 返回结构（JSON格式）
- @param {array} params.exportTableHead 导出表头列表（JSON数组）
- @param {array} params.topHeaders 导出顶级表头（JSON二维数组）
- @returns
  \*/
  export function up(params) {
  return request.put(`/shanshu-efficiency-api/common/export/config`, params);
  }

// Parameter interface
export interface UpParams {
/_删除标志 _/
delFlag?: string;

/_创建者 _/
createBy?: string;

/_创建者 _/
createByName?: string;

/_更新者 _/
updateBy?: string;

/_更新者 _/
updateByName?: string;

/_创建时间 _/
createTime?: Record<string, unknown>;

/_更新时间 _/
updateTime?: Record<string, unknown>;

/_主键ID _/
id?: number;

/_ExcelId _/
excelId: number;

/_Excel文件名称 _/
fileName: string;

/_模块名称 _/
module: string;

/_数据请求地址 _/
dataReqUrl: string;

/_请求结构（JSON格式） _/
queryStructure?: {
/_分页页码字段名map<字段名，数量> _/
pageNumMap?: Record<string, unknown>;

    /*分页字段一页数据量字段名map<字段名，数量> */
    pageSizeMap?: Record<string, unknown>;

    /*分页字段查询结果数量字段map<字段名，数量> */
    countMap?: Record<string, unknown>;

};

/_返回结构（JSON格式） _/
resultStructure?: {
/_统计字段所在全路劲 _/
totalNumPath?: Record<string, unknown>[];

    /*数据所在全路劲 */
    dataPath?: Record<string, unknown>[];

};

/_导出表头列表（JSON数组） _/
exportTableHead?: Record<string, unknown>[];

/_导出顶级表头（JSON二维数组） _/
topHeaders?: Record<string, unknown>[];
}

// Response interface
export interface UpRes {
/_返回码 _/
code: number;

/_返回码说明 _/
msg: string;

/_返回数据 _/
data: boolean;
}

/\*\*

- 修改excel规则
- @param {object} params 通用导出配置表
- @param {string} params.delFlag 删除标志
- @param {string} params.createBy 创建者
- @param {string} params.createByName 创建者
- @param {string} params.updateBy 更新者
- @param {string} params.updateByName 更新者
- @param {object} params.createTime 创建时间
- @param {object} params.updateTime 更新时间
- @param {number} params.id 主键ID
- @param {number} params.excelId ExcelId
- @param {string} params.fileName Excel文件名称
- @param {string} params.module 模块名称
- @param {string} params.dataReqUrl 数据请求地址
- @param {object} params.queryStructure 请求结构（JSON格式）
- @param {object} params.resultStructure 返回结构（JSON格式）
- @param {array} params.exportTableHead 导出表头列表（JSON数组）
- @param {array} params.topHeaders 导出顶级表头（JSON二维数组）
- @returns
  \*/
  export function up(params: UpParams): Promise<UpRes> {
  return request.put(`/shanshu-efficiency-api/common/export/config`, params);
  }

/\*\*

- 新增excel规则
- @param {object} params 通用导出配置表
- @param {string} params.delFlag 删除标志
- @param {string} params.createBy 创建者
- @param {string} params.createByName 创建者
- @param {string} params.updateBy 更新者
- @param {string} params.updateByName 更新者
- @param {object} params.createTime 创建时间
- @param {object} params.updateTime 更新时间
- @param {number} params.id 主键ID
- @param {number} params.excelId ExcelId
- @param {string} params.fileName Excel文件名称
- @param {string} params.module 模块名称
- @param {string} params.dataReqUrl 数据请求地址
- @param {object} params.queryStructure 请求结构（JSON格式）
- @param {object} params.resultStructure 返回结构（JSON格式）
- @param {array} params.exportTableHead 导出表头列表（JSON数组）
- @param {array} params.topHeaders 导出顶级表头（JSON二维数组）
- @returns
  \*/
  export function add_14(params) {
  return request.post(`/shanshu-efficiency-api/common/export/config/add`, params);
  }

// Parameter interface
export interface Add*14Params {
/*删除标志 \_/
delFlag?: string;

/_创建者 _/
createBy?: string;

/_创建者 _/
createByName?: string;

/_更新者 _/
updateBy?: string;

/_更新者 _/
updateByName?: string;

/_创建时间 _/
createTime?: Record<string, unknown>;

/_更新时间 _/
updateTime?: Record<string, unknown>;

/_主键ID _/
id?: number;

/_ExcelId _/
excelId: number;

/_Excel文件名称 _/
fileName: string;

/_模块名称 _/
module: string;

/_数据请求地址 _/
dataReqUrl: string;

/_请求结构（JSON格式） _/
queryStructure?: {
/_分页页码字段名map<字段名，数量> _/
pageNumMap?: Record<string, unknown>;

    /*分页字段一页数据量字段名map<字段名，数量> */
    pageSizeMap?: Record<string, unknown>;

    /*分页字段查询结果数量字段map<字段名，数量> */
    countMap?: Record<string, unknown>;

};

/_返回结构（JSON格式） _/
resultStructure?: {
/_统计字段所在全路劲 _/
totalNumPath?: Record<string, unknown>[];

    /*数据所在全路劲 */
    dataPath?: Record<string, unknown>[];

};

/_导出表头列表（JSON数组） _/
exportTableHead?: Record<string, unknown>[];

/_导出顶级表头（JSON二维数组） _/
topHeaders?: Record<string, unknown>[];
}

// Response interface
export interface Add*14Res {
/*返回码 \_/
code: number;

/_返回码说明 _/
msg: string;

/_返回数据 _/
data: boolean;
}

/\*\*

- 新增excel规则
- @param {object} params 通用导出配置表
- @param {string} params.delFlag 删除标志
- @param {string} params.createBy 创建者
- @param {string} params.createByName 创建者
- @param {string} params.updateBy 更新者
- @param {string} params.updateByName 更新者
- @param {object} params.createTime 创建时间
- @param {object} params.updateTime 更新时间
- @param {number} params.id 主键ID
- @param {number} params.excelId ExcelId
- @param {string} params.fileName Excel文件名称
- @param {string} params.module 模块名称
- @param {string} params.dataReqUrl 数据请求地址
- @param {object} params.queryStructure 请求结构（JSON格式）
- @param {object} params.resultStructure 返回结构（JSON格式）
- @param {array} params.exportTableHead 导出表头列表（JSON数组）
- @param {array} params.topHeaders 导出顶级表头（JSON二维数组）
- @returns
  \*/
  export function add_14(params: Add_14Params): Promise<Add_14Res> {
  return request.post(`/shanshu-efficiency-api/common/export/config/add`, params);
  }

/\*\*

- 删除excel规则
- @param {string} id
- @returns
  \*/
  export function del(id) {
  return request.delete(`/shanshu-efficiency-api/common/export/config/${id}`);
  }

// Response interface
export interface DelRes {
/_返回码 _/
code: number;

/_返回码说明 _/
msg: string;

/_返回数据 _/
data: boolean;
}

/\*\*

- 删除excel规则
- @param {string} id
- @returns
  \*/
  export function del(id: number): Promise<DelRes> {
  return request.delete(`/shanshu-efficiency-api/common/export/config/${id}`);
  }
