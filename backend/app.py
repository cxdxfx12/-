"""
DataViz Desktop Python Backend
数据处理和图表生成服务
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import json
import uuid
import re
from datetime import datetime
from typing import Dict, List, Any, Tuple

app = Flask(__name__)
CORS(app)

# 数据集存储
datasets: Dict[str, Dict] = {}

def detect_field_type(series: pd.Series) -> str:
    """检测字段类型"""
    # 去除空值
    series = series.dropna()
    
    if len(series) == 0:
        return 'string'
    
    # 尝试检测日期
    try:
        pd.to_datetime(series)
        return 'date'
    except:
        pass
    
    # 检查是否是数值
    if pd.api.types.is_numeric_dtype(series):
        # 检查是否是百分比 (0-100之间)
        if series.min() >= 0 and series.max() <= 100:
            # 如果所有值都是整数且在0-100之间，可能是百分比
            if series.dtype in [np.int64, np.int32]:
                return 'percentage'
        return 'number'
    
    # 检查是否是分类字段 (唯一值较少)
    unique_count = series.nunique()
    total_count = len(series)
    
    if unique_count <= 10 or unique_count / total_count < 0.1:
        return 'category'
    
    return 'string'

def parse_data(raw_data: str, source: str) -> Dict:
    """解析数据"""
    # 生成数据集ID
    dataset_id = str(uuid.uuid4())[:8]
    
    # 根据来源选择解析方式
    if source == 'paste':
        # 检测分隔符
        lines = raw_data.strip().split('\n')
        if len(lines) > 0:
            first_line = lines[0]
            if '\t' in first_line:
                separator = '\t'
            elif ',' in first_line:
                separator = ','
            elif ';' in first_line:
                separator = ';'
            else:
                separator = '\t'
        
        # 使用pandas解析
        df = pd.read_csv(pd.io.common.StringIO(raw_data), sep=separator)
    
    elif source in ['csv', 'excel']:
        # 尝试CSV解析
        try:
            df = pd.read_csv(pd.io.common.StringIO(raw_data))
        except:
            # 尝试其他分隔符
            df = pd.read_csv(pd.io.common.StringIO(raw_data), sep='\t')
    
    else:
        df = pd.read_csv(pd.io.common.StringIO(raw_data), sep='\t')
    
    # 分析字段
    fields = []
    for col in df.columns:
        field_info = {
            'name': col,
            'type': detect_field_type(df[col]),
            'sampleValues': df[col].dropna().head(3).tolist(),
            'nullCount': int(df[col].isna().sum()),
            'uniqueCount': int(df[col].nunique())
        }
        fields.append(field_info)
    
    # 转换数据为字典列表
    data = df.fillna('').to_dict('records')
    
    # 数据集名称
    dataset_name = f"数据集_{datetime.now().strftime('%H%M%S')}"
    
    return {
        'id': dataset_id,
        'name': dataset_name,
        'fields': fields,
        'data': data,
        'rowCount': len(df),
        'source': source
    }

def recommend_chart_type(fields: List[Dict]) -> List[Dict]:
    """根据字段推荐图表类型"""
    recommendations = []
    
    # 统计字段类型
    number_fields = [f for f in fields if f['type'] == 'number']
    category_fields = [f for f in fields if f['type'] in ['category', 'string']]
    date_fields = [f for f in fields if f['type'] == 'date']
    
    # 日期 + 数值 → 折线图
    if date_fields and number_fields:
        recommendations.append({
            'chartType': 'line',
            'confidence': 0.9,
            'xAxis': date_fields[0]['name'],
            'yAxis': number_fields[0]['name'],
            'reason': '日期字段适合展示趋势变化，推荐使用折线图'
        })
    
    # 分类 + 数值 → 柱状图
    if category_fields and number_fields:
        recommendations.append({
            'chartType': 'bar',
            'confidence': 0.85,
            'xAxis': category_fields[0]['name'],
            'yAxis': number_fields[0]['name'],
            'reason': '分类字段适合做对比分析，推荐使用柱状图'
        })
    
    # 百分比字段 → 饼图
    percentage_fields = [f for f in fields if f['type'] == 'percentage']
    if percentage_fields and category_fields:
        recommendations.append({
            'chartType': 'pie',
            'confidence': 0.8,
            'xAxis': category_fields[0]['name'],
            'yAxis': percentage_fields[0]['name'],
            'reason': '百分比数据适合展示比例，推荐使用饼图'
        })
    
    # 多个数值字段 → 散点图
    if len(number_fields) >= 2:
        recommendations.append({
            'chartType': 'scatter',
            'confidence': 0.75,
            'xAxis': number_fields[0]['name'],
            'yAxis': number_fields[1]['name'],
            'reason': '两个数值字段适合展示相关性，推荐使用散点图'
        })
    
    return recommendations

@app.route('/api/data/parse', methods=['POST'])
def api_parse_data():
    """数据解析接口"""
    try:
        data = request.json
        raw_data = data.get('rawData', '')
        source = data.get('source', 'paste')
        
        if not raw_data:
            return jsonify({'error': 'No data provided'}), 400
        
        result = parse_data(raw_data, source)
        
        # 存储数据集
        datasets[result['id']] = result
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/recommend/<dataset_id>', methods=['GET'])
def api_recommend_chart(dataset_id):
    """图表推荐接口"""
    try:
        if dataset_id not in datasets:
            return jsonify({'error': 'Dataset not found'}), 404
        
        dataset = datasets[dataset_id]
        recommendations = recommend_chart_type(dataset['fields'])
        
        return jsonify(recommendations)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chart/generate', methods=['POST'])
def api_generate_chart():
    """生成图表配置"""
    try:
        data = request.json
        dataset_id = data.get('dataSetId')
        chart_type = data.get('chartType')
        x_axis = data.get('xAxis')
        y_axis = data.get('yAxis')
        
        if dataset_id not in datasets:
            return jsonify({'error': 'Dataset not found'}), 404
        
        dataset = datasets[dataset_id]
        
        # 提取图表数据
        chart_data = {
            'type': chart_type,
            'title': f'{y_axis} by {x_axis}',
            'data': dataset['data'][:100],  # 限制数据量
            'xAxis': x_axis,
            'yAxis': y_axis,
        }
        
        return jsonify(chart_data)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/report/save', methods=['POST'])
def api_save_report():
    """保存报告"""
    try:
        report = request.json
        report_id = report.get('id', str(uuid.uuid4())[:8])
        report['updatedAt'] = datetime.now().isoformat()
        
        # 这里可以保存到数据库或文件
        # 目前仅返回成功状态
        
        return jsonify({
            'success': True,
            'path': f'{report.get("title", "未命名报告")}.report'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/report/open', methods=['POST'])
def api_open_report():
    """打开报告"""
    try:
        data = request.json
        file_path = data.get('filePath')
        
        # 这里应该从文件读取
        # 目前返回空报告
        
        return jsonify({
            'id': str(uuid.uuid4())[:8],
            'title': '导入的报告',
            'pageSize': '16:9',
            'components': [],
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/report/recent', methods=['GET'])
def api_get_recent():
    """获取最近文件列表"""
    # 返回空列表
    return jsonify([])

@app.route('/api/export/pdf/<report_id>', methods=['POST'])
def api_export_pdf(report_id):
    """导出PDF"""
    # TODO: 实现PDF导出
    return jsonify({'message': 'PDF export not implemented'}), 501

@app.route('/api/export/png/<report_id>', methods=['POST'])
def api_export_png(report_id):
    """导出PNG"""
    # TODO: 实现PNG导出
    return jsonify({'message': 'PNG export not implemented'}), 501

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    print("=" * 60)
    print("DataViz Desktop Backend Server")
    print("=" * 60)
    print("Design by: 杭州喵喵至家网络有限公司")
    print("Version: V1.0.0")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)