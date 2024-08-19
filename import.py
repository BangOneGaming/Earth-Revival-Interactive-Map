import os
import json
import csv

def load_names_and_desc_from_csv(csv_path):
    names_dict = {}
    desc_dict = {}
    with open(csv_path, 'r', encoding='utf-8') as csv_file:
        reader = csv.reader(csv_file)
        next(reader)  # 跳过表头
        for row in reader:
            if len(row) >= 5:  # 确保至少有5列数据
                id_value = row[0]
                name_in = row[3]
                description = row[4]  # 假设 description 是第5列（索引为4）
                coordinates = row[5]  # 假设 Coordinates 是第6列（索引为5）
                
                # 组合 description 和 Coordinates 成 desc
                desc = f" ({coordinates}) {description}"
                if desc:
                    print(desc)
                names_dict[id_value] = name_in
                desc_dict[id_value] = desc
    return names_dict, desc_dict

def update_json_objects(folder_path, names_dict, desc_dict, output_json):
    updated_objects = {}
    
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            file_path = os.path.join(folder_path, filename)
            
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = file.read()
                    json_data = json.loads(content)
                    
                    # 更新JSON对象
                    for key, value in json_data.items():
                        id_value = value.get('id')
                        if id_value in names_dict:
                            value['en_name'] = names_dict[id_value]
                            # 更新 desc 字段
                            if id_value in desc_dict:
                                value['desc'] = desc_dict[id_value]
                            
                            # 检查 en_name 是否存在且不为空
                            if 'en_name' in value and value['en_name']:
                                updated_objects[key] = value
            
            except json.JSONDecodeError as e:
                print(f"文件 {filename} 解析错误：{e}")
            except Exception as e:
                print(f"处理文件 {filename} 时出错：{e}")

    # 仅写入有en_name且不为空的对象
    if updated_objects:
        with open(output_json, 'w', encoding='utf-8') as out_file:
            json.dump(updated_objects, out_file, ensure_ascii=False, indent=4)
        print(f"更新后的JSON已保存到 {output_json}")
    else:
        print("没有找到匹配的对象，未生成新的JSON文件。")

# 使用方法
folder_path = 'markers'  # 替换为你的JSON文件夹路径
csv_path = 'names.csv'  # 替换为你的CSV文件路径
output_json = 'updated_output.json'  # 输出的JSON文件名

# 加载CSV中的名称数据和描述数据
names_dict, desc_dict = load_names_and_desc_from_csv(csv_path)

# 更新JSON文件中的对象并生成新的JSON文件
update_json_objects(folder_path, names_dict, desc_dict, output_json)
