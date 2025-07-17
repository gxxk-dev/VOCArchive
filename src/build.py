import os,yaml,re,shutil,json
from utils import FindFile,Path2Replace

filePathList=[]

def Build_CollectFilePath(_1,_2,path):
    """收集文件路径."""
    global filePathList
    filePathList.append(path)

def Build(songPackPath:str,outputPath:str="./build",link2copy=False):
    """主入口.

    args:
        songPackPath: 歌曲包路径
        outputPath: 输出路径
        link2copy: 是否使用链接代替复制
    """
    os.makedirs('build/res', exist_ok=True)
    pattern=re.compile(r'.*info[^\\/]*\.(ya?ml)$', re.IGNORECASE)
    # 歌曲信息处理
    for song in FindFile(songPackPath,pattern):
        songPath=os.path.join(songPackPath,song)

        if not os.path.isdir(songPath): #类型检查
            raise UserWarning() # 非目录报错 
        
        with open(os.path.join(songPath,"info.yaml"),'r',encoding='utf-8') as f:
            info=yaml.safe_load(f)
        # Hash...

        info["files"]=Path2Replace(info,songPath,BeforeReplace=songPackPath)
    # 写入歌曲信息
    with open(os.path.join(outputPath,"song.json"), "w", encoding="utf-8") as f:
        json.dump(info, f)

    # 歌曲文件操作
    for path in filePathList:
        if link2copy:
            os.symlink(path,os.path.join(outputPath,path))
        else:
            shutil.copy(path,os.path.join(outputPath,path))
    
    with open(os.path.join(outputPath,"info.json"), "w", encoding="utf-8") as f:
        f.write('{"apiEnable":false,"apiUrl":"","songInfoUrl":"/song.json","resUrl":"/res"}')