import cv2
from enum import Enum


class ImgIO:
    __META_DATA = 114
    """
    图像的第一个像素表示为 (i, j, k)
    **i** 为固定值 `114` 用于标识加密方式
    **j** 
    - 若 $0<j<=255$
      **j** 为数据长度，表示接下来有多少个颜色值（一个像素含有3个颜色值）包含数据
      **k** 以及之后的颜色值（共j个），表示储存的信息
    - 若j为0
      **k** 为数据长度，表示接下来有多少个颜色值包含长度信息L。长度信息表示有多少个颜色值包含数据
      接下来L个颜色值，表示储存的信息
    """

    class ResultType(Enum):
        SUCCESS = 1
        FILE_ERROR = 2
        INVALID_FORMAT = 3
        PIXEL_INDEX_OUT_OF_RANGE = 4

    @staticmethod
    def __check_idx(height: int, width: int, idx: int) -> bool:
        """
        当不可用时，返回False
        """
        return height * width * 3 > idx

    @staticmethod
    def __get_xy(height: int, width: int, idx: int) -> tuple[int, int, int]:
        """
        idx由0开始
        """
        pix_id = idx // 3
        col_id = idx % 3
        x = pix_id // width
        y = pix_id % width
        return (x, y, col_id)

    @staticmethod
    def LoadFromImg(ImagePath: str) -> tuple[ResultType, list[int]]:
        # Read image file
        Image = cv2.imread(ImagePath)
        if Image is None:
            return (ImgIO.ResultType.FILE_ERROR, [])
        # Get image data and meta data
        (Height, Width) = Image.shape[:2]
        (meta, data_len, buf) = Image[0, 0]
        offset = 2
        if meta != ImgIO.__META_DATA:
            return (ImgIO.ResultType.INVALID_FORMAT, [])
        # Read the lenth of data block if it exceeds 255
        if data_len == 0:
            info_size = buf
            # `+1` 是因为长度信息后至少有一位数据
            if not ImgIO.__check_idx(Height, Width, offset + info_size + 1):
                return (ImgIO.ResultType.PIXEL_INDEX_OUT_OF_RANGE, [])
            # read info size
            for i in range(0, info_size):
                offset += 1
                (x, y, col) = ImgIO.__get_xy(Height, Width, offset)
                buf = list(Image[x, y])[col]
                data_len = data_len * 256 + buf
            # Reset `buf`
            offset += 1
            (x, y, col) = ImgIO.__get_xy(Height, Width, offset)
            buf = list(Image[x, y])[col]
        # Read data
        res = [int(buf)]
        # `-1` 是因为已经读取一位数据
        if not ImgIO.__check_idx(Height, Width, offset + data_len - 1):
            return (ImgIO.ResultType.PIXEL_INDEX_OUT_OF_RANGE, [])
        for i in range(1, data_len):
            offset += 1
            (x, y, col) = ImgIO.__get_xy(Height, Width, offset)
            buf = Image[x, y][col]
            res.append(int(buf))
        return (ImgIO.ResultType.SUCCESS, res)

    @staticmethod
    def WriteToImg(
        input_img_path: str, output_img_path: str, data: list[int]
    ) -> ResultType:
        # Read image file
        img = cv2.imread(input_img_path)
        if img is None:
            return ImgIO.ResultType.FILE_ERROR
        (height, width) = img.shape[:2]
        # 写入 meta 信息
        img[0, 0][0] = ImgIO.__META_DATA
        data_len = len(data)
        offset = 0
        # 写入长度信息
        if data_len > 255:
            # 如果长度大于255
            # 获取长度数组
            info = []
            tmp = data_len
            while tmp > 0:
                info.append(tmp % 256)
                tmp = tmp // 256
            info.reverse()
            # 检查长度是否合法
            info_len = len(info)
            # `+1`是因为原本的长度位填0
            if not ImgIO.__check_idx(height, width, offset + info_len + 1):
                return ImgIO.ResultType.PIXEL_INDEX_OUT_OF_RANGE
            # 原本长度位填零
            offset += 1
            (x, y, col) = ImgIO.__get_xy(height, width, offset)
            img[x, y][col] = 0
            # 写入长度位
            for bit in info:
                offset += 1
                (x, y, col) = ImgIO.__get_xy(height, width, offset)
                img[x, y][col] = bit
        else:
            # 若长度小于255，直接写入长度位
            offset += 1
            (x, y, col) = ImgIO.__get_xy(height, width, offset)
            img[x, y][col] = data_len
        # 检查数据长度是否合法
        if not ImgIO.__check_idx(height, width, offset + data_len):
            return ImgIO.ResultType.PIXEL_INDEX_OUT_OF_RANGE
        # 写入长度信息
        for bit in data:
            offset += 1
            (x, y, col) = ImgIO.__get_xy(height, width, offset)
            img[x, y][col] = bit
        cv2.imwrite(output_img_path, img)
        return ImgIO.ResultType.SUCCESS


res, data = ImgIO.LoadFromImg("/mnt/d/Image.png")
