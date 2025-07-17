import hashlib,os,re,shutil
from typing import Callable

def FileHash(filePath: str, HashMethod=hashlib.sha512) -> str:
    """Hash文件
    args:
        file_path: 文件路径
        hash_method: [可被调用]hash方法
    return:
        str: hash值"""
    h = HashMethod()
    with open(filePath, 'rb') as f:
        while b := f.read(8192):
            h.update(b)
    return h.hexdigest()

def FindFile(rootDir:str,pattern:re.Pattern)->list:
    """递归查找文件名符合设定的文件

    args:
        rootDir: 查找的根目录
        pattern: 用于匹配文件名的正则
    return:
        list: 匹配到的文件列表
    """
    infoFiles=[]
    for root, _, files in os.walk(rootDir):
        for file in files:
            if pattern.match(file):
                infoFiles.append(os.path.join(root, file))
    return infoFiles

def Path2Replace(obj, rootDir:str,ReplaceMethod:Callable[[str],str]=FileHash,BeforeReplace:Callable[[str,str,str],None]=None):
    """递归遍历对象 替换文件路径为指定对象
    
    args:
        obj: 待处理对象
        rootDir: 根目录
        ReplaceMethod: 决定替换内容的函数 传入/传出为替换前/替换后内容
        BeforeReplace: 替换前处理方法 传入为替换前内容/替换后内容/路径
    return:
        obj: 处理后的对象
    """ 
    # TODO: 基于Py可变对象的特性优化此处代码
    if isinstance(obj, dict):
        # dict:递归处理
        return {k: Path2Replace(v, rootDir) for k, v in obj.items()}
    elif isinstance(obj, list):
        # 同上 懒得写注释了()
        return [Path2Replace(item, rootDir) for item in obj]
    elif isinstance(obj, str):
        if os.path.isabs(obj): # 完整路径 直接算
            OriginContent,ReplaceContent=obj,ReplaceMethod(obj)
            if BeforeReplace is not None:
                BeforeReplace(OriginContent,ReplaceContent,os.path.join(rootDir, obj))
            return ReplaceMethod
        else:
            return Path2Replace(os.path.join(rootDir, obj))
    else:
        raise NotImplementedError()
        #非预期情况 懒得适配()

def CleanDir(dirPath):
    """清空目标目录（文件、硬链接、软链接）"""
    if not os.path.isdir(dirPath):
        return NotImplementedError()
    
    # 递归清空内容
    for item in os.listdir(dirPath):
        item_path = os.path.join(dirPath, item)
        
        # 符号链接：直接删除链接
        if os.path.islink(item_path):
            os.unlink(item_path)
            
        # 目录：递归清空并删除
        elif os.path.isdir(item_path):
            shutil.rmtree(item_path, ignore_errors=True)
            
        # 文件/硬链接：直接删除
        else:
            try:
                os.remove(item_path)
            except:
                # 只读文件处理
                os.chmod(item_path, 0o777)  # 给予完全权限
                os.remove(item_path)