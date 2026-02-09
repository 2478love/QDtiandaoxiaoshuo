/**
 * 数据备份服务
 * 提供数据导出、导入和备份提醒功能
 */

export interface BackupData {
  version: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface ImportResult {
  success: boolean;
  message: string;
}

export class BackupService {
  private static readonly BACKUP_VERSION = '1.0';
  private static readonly LAST_BACKUP_KEY = 'tiandao_last_backup';
  private static readonly BACKUP_REMINDER_DAYS = 7;

  /**
   * 导出所有数据
   * @returns JSON 字符串
   */
  static exportAllData(): string {
    const data: Record<string, any> = {};
    
    // 遍历所有 localStorage 键
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('tiandao_')) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            // 尝试解析 JSON
            data[key] = JSON.parse(value);
          } catch {
            // 如果不是 JSON，直接存储字符串
            data[key] = value;
          }
        }
      }
    }
    
    // 添加元数据
    const backup: BackupData = {
      version: this.BACKUP_VERSION,
      timestamp: new Date().toISOString(),
      data
    };
    
    return JSON.stringify(backup, null, 2);
  }

  /**
   * 下载备份文件
   */
  static downloadBackup(): void {
    try {
      const json = this.exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // 生成文件名：tiandao-backup-YYYY-MM-DD-HHmmss.json
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const timeStr = now.toISOString().slice(11, 19).replace(/:/g, ''); // HHmmss
      a.download = `tiandao-backup-${dateStr}-${timeStr}.json`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // 记录备份时间
      localStorage.setItem(this.LAST_BACKUP_KEY, new Date().toISOString());
    } catch (error) {
      console.error('备份下载失败:', error);
      throw new Error('备份下载失败，请重试');
    }
  }

  /**
   * 导入数据
   * @param file 备份文件
   * @returns 导入结果
   */
  static async importData(file: File): Promise<ImportResult> {
    try {
      // 验证文件类型
      if (!file.name.endsWith('.json')) {
        return { 
          success: false, 
          message: '请选择 JSON 格式的备份文件' 
        };
      }

      // 读取文件内容
      const text = await file.text();
      const backup: BackupData = JSON.parse(text);
      
      // 验证备份格式
      if (!backup.version || !backup.data) {
        return { 
          success: false, 
          message: '备份文件格式不正确，请检查文件是否完整' 
        };
      }

      // 验证版本兼容性
      if (backup.version !== this.BACKUP_VERSION) {
        console.warn(`备份版本不匹配: ${backup.version} vs ${this.BACKUP_VERSION}`);
        // 暂时允许不同版本，但给出警告
      }

      // 恢复数据
      let restoredCount = 0;
      Object.entries(backup.data).forEach(([key, value]) => {
        try {
          const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(key, valueStr);
          restoredCount++;
        } catch (error) {
          console.error(`恢复数据失败 [${key}]:`, error);
        }
      });

      // 更新最后备份时间
      if (backup.timestamp) {
        localStorage.setItem(this.LAST_BACKUP_KEY, backup.timestamp);
      }
      
      return { 
        success: true, 
        message: `数据导入成功！已恢复 ${restoredCount} 项数据。请刷新页面以应用更改。` 
      };
    } catch (error: any) {
      console.error('导入失败:', error);
      
      if (error instanceof SyntaxError) {
        return { 
          success: false, 
          message: '备份文件格式错误，无法解析 JSON' 
        };
      }
      
      return { 
        success: false, 
        message: `导入失败：${error.message || '未知错误'}` 
      };
    }
  }

  /**
   * 检查是否需要备份提醒
   * @returns 是否需要提醒
   */
  static needsBackupReminder(): boolean {
    try {
      const lastBackup = localStorage.getItem(this.LAST_BACKUP_KEY);
      
      // 如果从未备份过，需要提醒
      if (!lastBackup) {
        return true;
      }
      
      // 计算距离上次备份的天数
      const lastBackupDate = new Date(lastBackup);
      const now = new Date();
      const diffMs = now.getTime() - lastBackupDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      // 超过设定天数则提醒
      return diffDays > this.BACKUP_REMINDER_DAYS;
    } catch (error) {
      console.error('检查备份提醒失败:', error);
      return false;
    }
  }

  /**
   * 获取上次备份时间
   * @returns ISO 时间字符串或 null
   */
  static getLastBackupTime(): string | null {
    return localStorage.getItem(this.LAST_BACKUP_KEY);
  }

  /**
   * 获取备份数据统计
   * @returns 统计信息
   */
  static getBackupStats(): {
    totalItems: number;
    totalSize: number;
    lastBackup: string | null;
  } {
    let totalItems = 0;
    let totalSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('tiandao_')) {
        totalItems++;
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
    }

    return {
      totalItems,
      totalSize,
      lastBackup: this.getLastBackupTime(),
    };
  }

  /**
   * 格式化文件大小
   * @param bytes 字节数
   * @returns 格式化后的字符串
   */
  static formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
