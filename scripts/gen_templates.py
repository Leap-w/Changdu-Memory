#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
昌都记忆 Changdu Memory — Excel 导入模板生成器（带样式）

说明：
  npm 的 xlsx@0.18.5 社区版「写」样式不支持（styles 只在 0.18.6+ 支持且不进 npm），
  本机网络又无法安装新库，因此用 Python 标准库 zipfile 直接构造带样式的 xlsx。
  运行：py scripts/gen_templates.py   → 输出到 public/templates/*.xlsx

注意：模板定义需与 src/utils/templates.ts 的 TEMPLATES 保持同步（修改任一处要同步另一处）。
前端只保留 { label, fileName, headers, rowKeys }（预览/下载链接用），
示例行与逐列说明（columns）在这里定义并写入「数据」「填写说明」两个工作表。
"""

import os
import zipfile
from xml.sax.saxutils import escape as xml_escape

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'templates')

# 颜色（ARGB）
HEADER_BG = 'FF4F8EF7'   # 表头蓝
TITLE_BG = 'FF2F4858'    # 说明标题深蓝
SECTION_BG = 'FFEEF3F8'  # 说明表头浅灰
EXAMPLE = 'FFC0392B'     # 示例行红
FIXED = 'FFB26A00'       # 固定值橙
FREE = 'FF1E7A46'        # 自由填写绿
GRAY = 'FF6B7280'        # 灰
DARK = 'FF1F2937'        # 深灰


def col_width(headers, example, columns, i):
    """估算列宽（中文字符按 2 计）"""
    h = headers[i] or ''
    ex = str(example[i] if i < len(example) else '')
    opts = columns[i].get('options') or [] if i < len(columns) else []
    opt_len = max((len(o) for o in opts), default=0)
    w = max(len(h) * 2 + 2, len(ex) * 2 + 2, opt_len * 2 + 2, 10)
    return min(w, 32)


# ============ 模板定义（与 src/utils/templates.ts 同步） ============
TEMPLATES = {
    'diaries': {
        'label': '日记',
        'fileName': '日记导入模板.xlsx',
        'headers': ['日期', '标题', '内容'],
        'example': ['2026-07-29', '昌都的第一堂课', '今天第一次站上讲台…'],
        'columns': [
            {'name': '日期', 'required': True, 'type': 'date'},
            {'name': '标题', 'required': True, 'type': 'free'},
            {'name': '内容', 'required': False, 'type': 'free'},
        ],
    },
    'work_plans': {
        'label': '工作',
        'fileName': '工作导入模板.xlsx',
        'headers': ['日期', '时间段', '标题', '分类', '内容'],
        'example': ['2026-07-29', '上午', '英语教学', '活动', '三年级英语课'],
        'columns': [
            {'name': '日期', 'required': True, 'type': 'date'},
            {'name': '时间段', 'required': True, 'type': 'fixed', 'options': ['上午', '下午', '晚上'], 'note': '或英文 morning/afternoon/evening'},
            {'name': '标题', 'required': True, 'type': 'free'},
            {'name': '分类', 'required': False, 'type': 'fixed', 'options': ['会议', '监考', '培训', '活动', '其他'], 'note': '默认「其他」；或英文 meeting/exam_supervision/training/activity/other'},
            {'name': '内容', 'required': False, 'type': 'free'},
        ],
    },
    'expenses': {
        'label': '花费',
        'fileName': '花费导入模板.xlsx',
        'headers': ['日期', '类型', '分类', '金额', '备注', '时间'],
        'example': ['2026-07-29', '支出', '餐饮', 42.5, '午餐', '12:30'],
        'columns': [
            {'name': '日期', 'required': True, 'type': 'date'},
            {'name': '类型', 'required': False, 'type': 'fixed', 'options': ['支出', '收入'], 'note': '默认「支出」；或英文 expense/income'},
            {'name': '分类', 'required': True, 'type': 'fixed', 'note': '支出：餐饮/交通/零食/住宿/工作/娱乐/医疗/其他；收入：工资/补贴/奖金/兼职/红包/出二手/其他。中文或英文均可'},
            {'name': '金额', 'required': True, 'type': 'number', 'note': '正数，保留两位小数'},
            {'name': '备注', 'required': False, 'type': 'free'},
            {'name': '时间', 'required': False, 'type': 'time', 'note': 'HH:mm，如 12:30，可空'},
        ],
    },
    'students': {
        'label': '学生档案',
        'fileName': '学生导入模板.xlsx',
        'headers': ['姓名', '班级', '职务', '备注'],
        'example': ['张三', '三年三班', '班长', '喜欢画画，数学需要加强'],
        'columns': [
            {'name': '姓名', 'required': True, 'type': 'free'},
            {'name': '班级', 'required': False, 'type': 'free'},
            {'name': '职务', 'required': False, 'type': 'free'},
            {'name': '备注', 'required': False, 'type': 'free'},
        ],
    },
    'schedules': {
        'label': '课程表',
        'fileName': '课程表导入模板.xlsx',
        'headers': ['课程', '班级', '星期', '开始时间', '结束时间', '地点', '备注'],
        'example': ['英语', '三年级', 3, '08:00', '08:45', '教学楼301', ''],
        'columns': [
            {'name': '课程', 'required': True, 'type': 'free'},
            {'name': '班级', 'required': False, 'type': 'free'},
            {'name': '星期', 'required': True, 'type': 'fixed', 'options': ['1', '2', '3', '4', '5', '6', '7'], 'note': '1=周一 … 7=周日'},
            {'name': '开始时间', 'required': False, 'type': 'time', 'note': 'HH:mm，默认 08:00'},
            {'name': '结束时间', 'required': False, 'type': 'time', 'note': 'HH:mm，默认 09:00'},
            {'name': '地点', 'required': False, 'type': 'free'},
            {'name': '备注', 'required': False, 'type': 'free'},
        ],
    },
    'todos': {
        'label': '待办',
        'fileName': '待办导入模板.xlsx',
        'headers': ['日期', '标题', '分类', '优先级'],
        'example': ['2026-07-29', '准备教案', '教学', '高'],
        'columns': [
            {'name': '日期', 'required': True, 'type': 'date'},
            {'name': '标题', 'required': True, 'type': 'free'},
            {'name': '分类', 'required': False, 'type': 'fixed', 'options': ['教学', '生活', '成长'], 'note': '默认「教学」；或英文 teaching/life/growth'},
            {'name': '优先级', 'required': False, 'type': 'fixed', 'options': ['高', '中', '低'], 'note': '默认「中」；或英文 high/medium/low'},
        ],
    },
}


# ============ 样式（fonts / fills / borders / cellXfs 索引） ============
# fonts 索引
F_DEFAULT, F_HEADER, F_EXAMPLE, F_TITLE, F_GRAY, F_SECT_HEAD, F_REQ_NAME, F_REQ, F_FIXED, F_FREE = range(10)
# fills 索引
fill_none, fill_gray, fill_header, fill_title, fill_section = range(5)
# cellXfs 索引（与下方 styles.xml 一一对应）
SX_DEFAULT, SX_HEADER, SX_EXAMPLE, SX_TITLE, SX_GRAY, SX_SECT_HEAD, SX_REQ_NAME, SX_REQ, SX_FIXED, SX_FREE = range(10)


def build_styles_xml():
    fonts = [
        '<font><sz val="11"/><name val="Calibri"/></font>',                                              # 0 默认
        '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>',                  # 1 表头白加粗
        '<font><sz val="11"/><color rgb="%s"/><name val="Calibri"/></font>' % EXAMPLE,                  # 2 示例红
        '<font><b/><sz val="14"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>',                  # 3 说明标题
        '<font><sz val="10"/><color rgb="%s"/><name val="Calibri"/></font>' % GRAY,                      # 4 灰小字
        '<font><b/><sz val="11"/><color rgb="%s"/><name val="Calibri"/></font>' % DARK,                  # 5 说明表头
        '<font><b/><sz val="11"/><color rgb="%s"/><name val="Calibri"/></font>' % EXAMPLE,               # 6 必填列名红加粗
        '<font><sz val="11"/><color rgb="%s"/><name val="Calibri"/></font>' % EXAMPLE,                   # 7 必填红
        '<font><sz val="11"/><color rgb="%s"/><name val="Calibri"/></font>' % FIXED,                     # 8 固定值橙
        '<font><sz val="11"/><color rgb="%s"/><name val="Calibri"/></font>' % FREE,                      # 9 自由填写绿
    ]
    fills = [
        '<fill><patternFill patternType="none"/></fill>',
        '<fill><patternFill patternType="gray125"/></fill>',
        '<fill><patternFill patternType="solid"><fgColor rgb="%s"/></patternFill></fill>' % HEADER_BG,
        '<fill><patternFill patternType="solid"><fgColor rgb="%s"/></patternFill></fill>' % TITLE_BG,
        '<fill><patternFill patternType="solid"><fgColor rgb="%s"/></patternFill></fill>' % SECTION_BG,
    ]
    borders = ['<border><left/><right/><top/><bottom/><diagonal/></border>']
    # xf: fontId, fillId, alignment
    xfs = [
        '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
        '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment horizontal="center" vertical="center"/></xf>',
        '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>',
        '<xf numFmtId="0" fontId="3" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf>',
        '<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center" wrapText="1"/></xf>',
        '<xf numFmtId="0" fontId="5" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment horizontal="center" vertical="center"/></xf>',
        '<xf numFmtId="0" fontId="6" fillId="0" borderId="0" xfId="0" applyFont="1"/>',
        '<xf numFmtId="0" fontId="7" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment horizontal="center"/></xf>',
        '<xf numFmtId="0" fontId="8" fillId="0" borderId="0" xfId="0" applyFont="1"/>',
        '<xf numFmtId="0" fontId="9" fillId="0" borderId="0" xfId="0" applyFont="1"/>',
    ]
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        '<numFmts count="0"/>'
        '<fonts count="%d">%s</fonts>'
        '<fills count="%d">%s</fills>'
        '<borders count="1">%s</borders>'
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        '<cellXfs count="%d">%s</cellXfs>'
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
        '</styleSheet>'
    ) % (len(fonts), ''.join(fonts), len(fills), ''.join(fills), borders[0], len(xfs), ''.join(xfs))


def cell_str(addr, text, sx):
    return '<c r="%s" t="inlineStr" s="%d"><is><t>%s</t></is></c>' % (addr, sx, xml_escape(text))


def cell_num(addr, num, sx):
    return '<c r="%s" s="%d"><v>%s</v></c>' % (addr, sx, num)


def cell_by_value(addr, value, sx):
    if isinstance(value, bool):
        return cell_str(addr, '是' if value else '', sx)
    if isinstance(value, (int, float)):
        return cell_num(addr, value, sx)
    return cell_str(addr, str(value), sx)


def col_letter(i):
    return chr(ord('A') + i)


def build_data_sheet_xml(defn):
    headers, example, columns = defn['headers'], defn['example'], defn['columns']
    n = len(headers)
    cols = ''.join('<col min="%d" max="%d" width="%g" customWidth="1"/>' % (i + 1, i + 1, col_width(headers, example, columns, i)) for i in range(n))

    # 表头行（sx=1）
    head_cells = ''.join(cell_str(col_letter(i) + '1', headers[i], SX_HEADER) for i in range(n))
    # 示例行（sx=2 标红）
    ex_cells = ''.join(cell_by_value(col_letter(i) + '2', example[i], SX_EXAMPLE) for i in range(n))

    sheet = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        '<dimension ref="A1:%s2"/>'
        '<cols>%s</cols>'
        '<sheetData>'
        '<row r="1" ht="22" customHeight="1">%s</row>'
        '<row r="2">%s</row>'
        '</sheetData>'
        '</worksheet>'
    ) % (col_letter(n - 1), cols, head_cells, ex_cells)
    return sheet


def type_label(t):
    return {
        'free': '自由填写',
        'date': '日期（YYYY-MM-DD）',
        'number': '数字',
        'time': '时间（HH:mm）',
        'fixed': '固定值（选一个）',
    }[t]


def describe(col):
    parts = []
    opts = col.get('options') or []
    if opts:
        parts.append('可选：' + ' / '.join(opts))
    if col.get('note'):
        parts.append(col['note'])
    return '；'.join(parts)


def type_sx(t):
    if t == 'fixed':
        return SX_FIXED
    if t == 'free':
        return SX_FREE
    return SX_GRAY


def build_notes_sheet_xml(defn):
    label, columns = defn['label'], defn['columns']
    ncols = 4
    last_col = col_letter(ncols - 1)

    # 行 1：标题（合并 A:D）
    title = cell_str('A1', '昌都记忆 · %s填写说明' % label, SX_TITLE)
    # 行 2：副标题（合并 A:D）
    sub = cell_str('A2', '打开「数据」工作表填写：红色示例行是示范，请删除或覆盖后填入自己的数据。带 ※ 的列必填；「固定值」列只能填给定选项（中文即可，英文也兼容）；其他列可随意填写。', SX_GRAY)
    # 行 3：空行（默认）
    # 行 4：表头
    heads = ''.join(cell_str(col_letter(c) + '4', h, SX_SECT_HEAD) for c, h in enumerate(['列名', '必填', '填写方式', '允许值 / 说明']))
    # 行 5+：每列一行
    rows_xml = []
    for i, col in enumerate(columns):
        r = 5 + i
        name = ('※ ' if col['required'] else '') + col['name']
        sx_name = SX_REQ_NAME if col['required'] else SX_DEFAULT
        sx_req = SX_REQ if col['required'] else SX_GRAY
        rows_xml.append(
            cell_str('A%d' % r, name, sx_name)
            + cell_str('B%d' % r, '必填' if col['required'] else '选填', sx_req)
            + cell_str('C%d' % r, type_label(col['type']), type_sx(col['type']))
            + cell_str('D%d' % r, describe(col), type_sx(col['type']))
        )
    body = ''.join(rows_xml)

    # 末尾注（合并）
    last = 5 + len(columns)
    note = cell_str('A%d' % last, '注：日期格式 YYYY-MM-DD（如 2026-08-11）；金额为数字；时间为 HH:mm（如 12:30）。', SX_GRAY)

    merges = (
        '<mergeCells count="3">'
        '<mergeCell ref="A1:%s1"/>'
        '<mergeCell ref="A2:%s2"/>'
        '<mergeCell ref="A%d:%s%d"/>'
        '</mergeCells>'
    ) % (last_col, last_col, last, last_col, last)

    cols = ''.join(
        '<col min="%d" max="%d" width="%g" customWidth="1"/>' % (i + 1, i + 1, w)
        for i, w in enumerate([18, 8, 18, 64])
    )

    sheet = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        '<dimension ref="A1:%s%d"/>'
        '<cols>%s</cols>'
        '<sheetData>'
        '<row r="1" ht="26" customHeight="1">%s</row>'
        '<row r="2" ht="34" customHeight="1">%s</row>'
        '<row r="3"/>'
        '<row r="4" ht="20" customHeight="1">%s</row>'
        '%s'
        '<row r="%d">%s</row>'
        '</sheetData>'
        '%s'
        '</worksheet>'
    ) % (last_col, last, cols, title, sub, heads, body, last, note, merges)
    return sheet


def build_workbook_xml():
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        '<sheets>'
        '<sheet name="数据" sheetId="1" r:id="rId1"/>'
        '<sheet name="填写说明" sheetId="2" r:id="rId2"/>'
        '</sheets>'
        '</workbook>'
    )


def build_content_types_xml():
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
        '</Types>'
    )


def build_rels_xml():
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        '</Relationships>'
    )


def build_workbook_rels_xml():
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>'
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
        '</Relationships>'
    )


def write_xlsx(path, data_sheet, notes_sheet):
    styles = build_styles_xml()
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', build_content_types_xml())
        z.writestr('_rels/.rels', build_rels_xml())
        z.writestr('xl/workbook.xml', build_workbook_xml())
        z.writestr('xl/_rels/workbook.xml.rels', build_workbook_rels_xml())
        z.writestr('xl/styles.xml', styles)
        z.writestr('xl/worksheets/sheet1.xml', data_sheet)
        z.writestr('xl/worksheets/sheet2.xml', notes_sheet)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for key, defn in TEMPLATES.items():
        path = os.path.join(OUT_DIR, defn['fileName'])
        write_xlsx(path, build_data_sheet_xml(defn), build_notes_sheet_xml(defn))
        print('[OK] 已生成 %s' % os.path.relpath(path))
    print('完成：%d 个模板 -> %s' % (len(TEMPLATES), os.path.relpath(OUT_DIR)))


if __name__ == '__main__':
    main()
