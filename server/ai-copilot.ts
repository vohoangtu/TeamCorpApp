export interface AIDiagnosisResult {
  errorType: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  summary: string;
  rootCause: string;
  fileHint?: string;
  lineHint?: number;
  fixCommand?: string;
  fixExplanation: string;
  confidence: number;
}

export class AICopilotService {
  diagnoseError(logText: string, projectName: string = 'App'): AIDiagnosisResult {
    const text = logText || '';

    // Pattern 1: EADDRINUSE Port Collision
    const portMatch = text.match(/EADDRINUSE.*?(\d{3,5})/i) || text.match(/port (\d{3,5}) is already in use/i) || text.match(/address already in use (?:.*?:)?(\d{3,5})/i);
    if (portMatch) {
      const port = portMatch[1];
      return {
        errorType: 'PORT_CONFLICT',
        severity: 'critical',
        title: `Cổng mạng (Port ${port}) đang bị chiếm dụng`,
        summary: `Tiến trình của ${projectName} không thể bind vào port ${port} do một tiến trình khác đang lắng nghe trên cổng này.`,
        rootCause: `Port ${port} bị chiếm bởi tiến trình cũ (zombie process) hoặc ứng dụng khác đang chạy song song.`,
        fixCommand: `powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort ${port}).OwningProcess -Force"`,
        fixExplanation: `Sử dụng WinDev Hub Port Radar (<kbd>Ctrl+Shift+P</kbd>) hoặc chạy lệnh giải phóng để dừng tiến trình chiếm port ${port}.`,
        confidence: 0.98,
      };
    }

    // Pattern 2: Cannot find module / Missing Dependency
    const moduleMatch = text.match(/Cannot find module ['"]([^'"]+)['"]/i) || text.match(/Module not found: Can't resolve ['"]([^'"]+)['"]/i);
    if (moduleMatch) {
      const pkg = moduleMatch[1];
      const isRelative = pkg.startsWith('.') || pkg.startsWith('/');
      return {
        errorType: 'MISSING_MODULE',
        severity: 'critical',
        title: `Thiếu module hoặc đường dẫn file: "${pkg}"`,
        summary: isRelative
          ? `File import "${pkg}" không tồn tại tại đường dẫn chỉ định.`
          : `Gói phụ thuộc "${pkg}" chưa được cài đặt trong node_modules.`,
        rootCause: isRelative
          ? `Sai đường dẫn tương đối (relative import) hoặc file đã bị xóa/đổi tên.`
          : `Gói thư viện chưa được cài đặt vào dependencies.`,
        fixCommand: isRelative ? undefined : `npm install ${pkg}`,
        fixExplanation: isRelative
          ? `Kiểm tra lại đường dẫn import trong source code và đảm bảo đúng định dạng file (.ts, .tsx, .js).`
          : `Chạy lệnh \`npm install ${pkg}\` để cài đặt gói thư viện này vào dự án.`,
        confidence: 0.95,
      };
    }

    // Pattern 3: Database Connection Refused
    if (text.includes('ECONNREFUSED') && (text.includes('5432') || text.includes('3306') || text.includes('6379') || text.includes('27017') || text.includes('database'))) {
      const dbType = text.includes('5432') ? 'PostgreSQL' : text.includes('6379') ? 'Redis' : text.includes('3306') ? 'MySQL' : 'Database';
      return {
        errorType: 'DATABASE_OFFLINE',
        severity: 'critical',
        title: `Không thể kết nối đến ${dbType}`,
        summary: `Dịch vụ ${dbType} nội bộ chưa khởi chạy hoặc từ chối kết nối trên cổng mặc định.`,
        rootCause: `Máy chủ cơ sở dữ liệu ${dbType} đang ở trạng thái Stopped hoặc chuỗi kết nối trong .env sai thông tin xác thực.`,
        fixCommand: `docker compose up -d`,
        fixExplanation: `Khởi động container Docker của database hoặc kiểm tra lại chuỗi \`DATABASE_URL\` trong Visual .env Studio của WinDev Hub.`,
        confidence: 0.92,
      };
    }

    // Pattern 4: TypeScript TS Error
    const tsMatch = text.match(/(?:error\s+TS(\d+)|([a-zA-Z0-9_./\\-]+\.tsx?):(\d+):(\d+))/i);
    if (tsMatch) {
      const tsCode = tsMatch[1] ? `TS${tsMatch[1]}` : 'TypeScript Error';
      const file = tsMatch[2];
      const line = tsMatch[3] ? parseInt(tsMatch[3], 10) : undefined;
      return {
        errorType: 'TYPESCRIPT_ERROR',
        severity: 'warning',
        title: `Lỗi biên dịch ${tsCode}`,
        summary: `TypeScript phát hiện kiểu dữ liệu không hợp lệ hoặc thiếu thuộc tính trong code.`,
        rootCause: `Sai sót kiểu dữ liệu (Type mismatch) trong mã nguồn dự án.`,
        fileHint: file,
        lineHint: line,
        fixCommand: `npm run build`,
        fixExplanation: file ? `Mở file \`${file}\` tại dòng ${line} để bổ sung hoặc ép kiểu phù hợp.` : `Kiểm tra lại định nghĩa interface và props.`,
        confidence: 0.9,
      };
    }

    // Pattern 5: OpenSSL Legacy Crypto
    if (text.includes('ERR_OSSL_EVP_UNSUPPORTED')) {
      return {
        errorType: 'OPENSSL_UNSUPPORTED',
        severity: 'warning',
        title: `Lỗi Node.js OpenSSL Legacy Digital Envelope`,
        summary: `Phiên bản Node.js 17+ sử dụng thuật toán OpenSSL 3.0 không tương thích với Webpack 4 / Create React App cũ.`,
        rootCause: `Gói bundler cũ sử dụng thuật toán mã hóa MD4 đã bị OpenSSL hiện đại vô hiệu hóa.`,
        fixCommand: `$env:NODE_OPTIONS="--openssl-legacy-provider"`,
        fixExplanation: `Thiết lập biến môi trường NODE_OPTIONS để bật chế độ tương thích legacy provider.`,
        confidence: 0.96,
      };
    }

    // Default Fallback Analysis
    return {
      errorType: 'GENERAL_RUNTIME_ERROR',
      severity: 'info',
      title: 'Phát hiện sự cố thực thi tiến trình',
      summary: `Hệ thống ghi nhận log cảnh báo hoặc thông báo lỗi từ console của ${projectName}.`,
      rootCause: `Tiến trình gặp ngoại lệ chưa được xử lý trong runtime.`,
      fixCommand: `npm run dev`,
      fixExplanation: `Kiểm tra chi tiết log trong Terminal Console hoặc kích hoạt Hot-Sync để build lại.`,
      confidence: 0.75,
    };
  }
}

export const aiCopilot = new AICopilotService();
