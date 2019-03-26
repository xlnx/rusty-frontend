import maya.cmds as cmds
import re,os, json
import math

def alterKd(file):
    fp = open(file, "r+")
    content = fp.read()
    fp.close()
    content = content.replace("Kd 0.00 0.00 0.00",
                              "Kd 1.00 1.00 1.00")
    fp = open(file, "w")
    fp.write(content)
    fp.close()

scaleFactor = 0.0052
def exportJson(path, name, objName, placeHolder):
    fp = open(path + "/index.json", "w+")
    data = {'name': name,
            'model': objName,
            'scale': scaleFactor,
            'placeholder': placeHolder}
    fp.write(json.dumps(data, indent=4, sort_keys=True))

def placeHolder(obj):
    cmds.select(obj)
    cmds.scale(scaleFactor, scaleFactor, scaleFactor)
    bbox = cmds.exactWorldBoundingBox()
    print(bbox)
    cmds.scale(1/scaleFactor, 1/scaleFactor, 1/scaleFactor)
    cmds.select()
    xLength = bbox[3] - bbox[0]
    yLength = bbox[5] - bbox[2]
    scaleF = 80*4/3
    return [math.floor(xLength*scaleF), math.floor(yLength*scaleF)]

def mkdir(path):
    if not os.path.exists(path):
        os.mkdir(path)

root = "C:/Users/Administrator/Desktop/SimplePoly City.FBX/"
exportDir = root+"export"
mkdir(exportDir)

pathOfModels = root + "Models/Buildings"
pathOfTextures = root + "/Textures"
fileType = "fbx"
files = cmds.getFileList(folder=pathOfModels, filespec='*.%s' % fileType)

for fileName in files:
    filePath = pathOfModels + '/' + fileName
    shortName = fileName.replace(".fbx", "")
    fName = shortName
    print("Loading %s" % filePath)

    before = set(cmds.ls(assemblies=True))
    cmds.file(filePath, i=True)
    after = set(cmds.ls(assemblies=True))
    obj = after.difference(before)
    obj = list(obj)[0]

    textureName = fileName.replace("fbx", "png")
    texture = pathOfTextures + "/" + textureName
    cmds.setAttr("file1.fileTextureName", texture, type="string")

    cmds.select(obj)
    cmds.hyperShade(a="phong1")
    mkdir("%s/%s" %(exportDir, shortName))
    cmds.file("%s/%s/%s.obj" % (exportDir, shortName, fName), pr=False, force=True, typ="OBJexport",es=True,op="groups=0; ptgroups=0; materials=0; smoothing=0; normals=0")
    alterKd("%s/%s/%s.mtl" % (exportDir, shortName, fName))
    exportJson("%s/%s/" % (exportDir, shortName), shortName, fName+".obj", placeHolder(obj))
    cmds.select()
    
    cmds.delete()