import axios from 'axios';
import React, {
  ChangeEvent,
  FC,
  PropsWithChildren,
  useRef,
  useState
} from 'react';
import { isPromise, NOOP } from '../../helpers/utils';
import Button from '../Button';
import UploadList from './UploadList';

export interface IUploadProps {
  action: string; // 上传接口
  headers?: Record<string, unknown>; // 请求头
  data?: Record<string, string>; // 请求扩展参数
  name?: string; // 自定义上传名
  withCredentials?: boolean; // 是否允许携带 cookie
  accept?: string;
  multiple?: boolean;
  defaultUploadFileList?: UploadFile[]; // 默认已上传的文件列表
  beforeUpload?: (file: File) => boolean | Promise<File>;
  onChange?: (file: File) => void;
  onRemove?: (file: UploadFile) => void; // 删除事件
  onProgress?: (percentage: number, file: File) => void; // 上传进度回调事件
  onSuccess?: (data: unknown, file: File) => void; // 成功回调事件
  onError?: (data: unknown, file: File) => void; // 失败回调事件
  onPreview?: (file: UploadFile) => void; // 上传成功文件操作事件
}

export type UploadFileStatus = 'ready' | 'loading' | 'success' | 'fail';

export interface UploadFile {
  uid: string;
  size: number;
  name: string;
  status?: UploadFileStatus;
  percent: number;
  source?: File;
  response?: unknown;
  error?: unknown;
}

const Upload: FC<PropsWithChildren<IUploadProps>> = props => {
  const {
    action,
    headers,
    name = 'file',
    data,
    withCredentials,
    accept,
    multiple,
    defaultUploadFileList,
    beforeUpload,
    onError,
    onSuccess,
    onProgress,
    onChange,
    onRemove,
    onPreview
  } = props;
  const fileEl = useRef<HTMLInputElement>(null);
  const [fileList, setFileList] = useState<UploadFile[]>(
    defaultUploadFileList || []
  );

  const uploadFile = (files: FileList) => {
    const postFiles = [...files];

    postFiles.forEach(file => {
      if (!beforeUpload) {
        toUpload(file);
      } else {
        const res = beforeUpload(file);

        if (isPromise(res)) {
          res.then(correctFile => {
            toUpload(correctFile);
          });
        } else if (res) {
          toUpload(file);
        }
      }
    });
  };

  const updateFileList = (
    updateFile: UploadFile,
    updateObj: Partial<UploadFile>
  ) => {
    setFileList(prevList => {
      return prevList.map(item => {
        if (item.uid === updateFile.uid) {
          return {
            ...item,
            ...updateObj
          };
        } else {
          return item;
        }
      });
    });
  };

  const toUpload = (file: File) => {
    const currentFile: UploadFile = {
      uid: Date.now() + '',
      status: 'ready',
      name: file.name,
      size: file.size,
      percent: 0,
      source: file
    };
    setFileList(prevList => [currentFile, ...prevList]);

    const formData = new FormData();
    formData.append(name, file);
    if (data) {
      Object.entries(data).forEach(([key, val]) => {
        formData.append(key, val);
      });
    }

    axios
      .post(action, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        },
        withCredentials,
        onUploadProgress: e => {
          let percentage = 0;
          if (e.total) {
            percentage = Math.round((e.loaded * 100) / e.total) || 0;
          }
          if (percentage <= 100) {
            updateFileList(currentFile, {
              percent: percentage,
              status: 'loading'
            });
            if (onProgress) {
              onProgress(percentage, file);
            }
          }
        }
      })
      .then(resp => {
        console.log('resp', resp);
        updateFileList(currentFile, { status: 'success', response: resp.data });
        if (onSuccess) {
          onSuccess(resp, file);
        }
        if (onChange) {
          onChange(file);
        }
      })
      .catch(err => {
        console.error(err);
        updateFileList(currentFile, { status: 'fail', error: err });
        if (onError) {
          onError(err, file);
        }
        if (onChange) {
          onChange(file);
        }
      });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    uploadFile(files);
    if (fileEl.current) {
      fileEl.current.value = '';
    }
  };

  const handleRemove = (file: UploadFile) => {
    setFileList(prevList => {
      return prevList.filter(item => item.uid !== file.uid);
    });
    if (onRemove) {
      onRemove(file);
    }
  };

  const handlePreview = (file: UploadFile) => {
    if (onPreview) {
      onPreview(file);
    }
  };

  /**
   * 触发 file 点击事件
   *
   */
  const handleChangeFile = () => {
    if (fileEl.current) {
      fileEl.current.click();
    }
  };

  return (
    <div className="nnn-upload-component">
      <Button btnType="primary" onClick={handleChangeFile}>
        upload file
      </Button>
      <input
        ref={fileEl}
        style={{ display: 'none' }}
        type="file"
        name="myFile"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
      />
      <UploadList
        fileList={fileList}
        onRemove={handleRemove}
        onPreview={handlePreview}
      ></UploadList>
    </div>
  );
};

export default Upload;
