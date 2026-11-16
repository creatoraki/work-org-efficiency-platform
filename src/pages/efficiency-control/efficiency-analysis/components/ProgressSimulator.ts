export default class ProgressSimulator {
	private interval: NodeJS.Timeout | null = null;
	private _progress: number = 0;
	private readonly duration: number = 90_000; // 1.5 分钟 = 90,000 毫秒
	private readonly onUpdate: (progress: number) => void;

	constructor(onUpdate: (progress: number) => void) {
		this.onUpdate = onUpdate;
	}

	// 获取当前进度（只读）
	get progress(): number {
		return this._progress;
	}

	// 开始模拟进度（0 → 99，耗时 90 秒）
	start() {
		if (this._progress >= 100) return; // 已完成，不重复启动
		if (this.interval) return; // 已在运行

		const startTime = Date.now();
		const targetEndProgress = 99;

		this.interval = setInterval(() => {
			if (this._progress >= 100) {
				this.stop();
				return;
			}

			const elapsed = Date.now() - startTime;
			const ratio = Math.min(elapsed / this.duration, 1);
			const newProgress = Math.floor(ratio * targetEndProgress);

			// 防止超过 99
			this._progress = Math.min(newProgress, 99);
			this.onUpdate(this._progress);

			// 如果已达到 99，停止定时器（等待手动设为 100）
			if (this._progress >= 99) {
				this.stop();
			}
		}, 100); // 每 100ms 更新一次，更平滑
	}

	// 手动设置进度为 100（完成）
	complete() {
		this.setProgress(100);
	}

	// 手动设置任意进度（但 ≥100 会锁定为 100）
	setProgress(value: number) {
		if (this._progress >= 100) return; // 锁定状态

		this._progress = value >= 100 ? 100 : Math.max(0, Math.min(99, value));
		this.onUpdate(this._progress);

		if (this._progress >= 100) {
			this.stop();
		}
	}

	// 停止模拟
	stop() {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
	}

	// 重置进度为 0
	reset() {
		this.stop();
		this._progress = 0;
		this.onUpdate(this._progress);
	}
}
