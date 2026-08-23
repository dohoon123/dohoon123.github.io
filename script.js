/**
 * Dohoon Profile - JavaScript
 * Logic for Dark/Light mode theme switching with localStorage persistence
 * and DrawBranch decoration features.
 */

document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // 1. LocalStorage 및 시스템 설정(Media Query)을 감지하여 초기 테마 세팅
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
    }

    // 2. 테마 토글 버튼 클릭 이벤트 리스너 등록
    themeToggleBtn.addEventListener('click', () => {
        // 다크 모드 토글
        body.classList.toggle('dark-mode');

        // 상태 저장
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }

        // 버튼 클릭 시 마이크로 인터랙션 (회전 & 펄스 애니메이션 효과)
        themeToggleBtn.classList.add('active');
        setTimeout(() => {
            themeToggleBtn.classList.remove('active');
        }, 500);

        // 테마 변경에 맞춰 나뭇가지 색상 리드로우 (트랜지션 반영을 위해 50ms 지연)
        setTimeout(drawBranches, 50);
    });

    // 3. 네비게이션 부드러운 스크롤 보정 및 모바일 편의성 (선택사항)
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const targetId = link.getAttribute('href');
            if (targetId.startsWith('#') && targetId.length > 1) {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    event.preventDefault();
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // 4. DrawBranch 기능 구현
    function drawBranches() {
        const canvas = document.getElementById('branch-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // 캔버스 크기를 문서의 전체 스크롤 높이와 창 너비에 동기화
        const width = window.innerWidth;
        const height = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            window.innerHeight
        );

        canvas.width = width;
        canvas.height = height;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        // 기존 드로잉 초기화
        ctx.clearRect(0, 0, width, height);

        // CSS 변수에서 테마별 가지 색상 로드 (없으면 기본 갈색)
        const branchColor = getComputedStyle(document.body).getPropertyValue('--branch-color').trim() || '#8C6A60';

        // 겹치는 부분의 알파 채널 가중을 방지하기 위해 오프스크린 캔버스에서 먼저 드로잉
        const offscreen = document.createElement('canvas');
        offscreen.width = width;
        offscreen.height = height;
        const oCtx = offscreen.getContext('2d');

        // 웹페이지 높이에 따른 동적 트리 레벨(깊이) 및 파라미터 세팅
        const totalGrowthHeight = height - 100;
        let maxDepth = 3;
        let shares = [0.28, 0.32, 0.22, 0.15];
        let segmentCounts = [7, 5, 4, 3];

        if (height > 2400) {
            maxDepth = 4;
            shares = [0.22, 0.28, 0.22, 0.16, 0.12];
            segmentCounts = [7, 5, 4, 3, 2];
        } else if (height > 1200) {
            maxDepth = 3;
            shares = [0.28, 0.32, 0.22, 0.15];
            segmentCounts = [7, 5, 4, 3];
        } else {
            maxDepth = 2;
            shares = [0.32, 0.35, 0.25];
            segmentCounts = [6, 4, 3];
        }

        // 깊이별 기준 세그먼트 길이를 계산하는 헬퍼 함수
        function getSegmentLength(depth) {
            const hShare = totalGrowthHeight * shares[depth];
            const count = segmentCounts[depth];
            const dy = hShare / count;
            return dy / 0.93;
        }

        // CSS 변수에서 테마별 잎사귀 색상 로드 (없으면 기본값)
        const leafColor1 = getComputedStyle(document.body).getPropertyValue('--accent-color').trim() || '#8FA89B';
        const leafColor2 = getComputedStyle(document.body).getPropertyValue('--primary-color').trim() || '#E26B82';

        // 나뭇잎을 그리는 헬퍼 함수 (크기를 약 2배로 증가)
        function drawLeaf(x, y, branchAngle) {
            oCtx.save();
            oCtx.beginPath();
            const radiusX = 12 + Math.random() * 8; // 기존 6~11에서 12~20으로 약 2배 증가
            const radiusY = 7 + Math.random() * 5;  // 기존 3.5~6.5에서 7~12로 약 2배 증가
            // 로즈 핑크(primary)와 세이지 그린(accent) 테마 컬러 혼합 적용
            oCtx.fillStyle = Math.random() < 0.65 ? leafColor1 : leafColor2;
            oCtx.globalAlpha = 0.45 + Math.random() * 0.35; // 중첩 시 비치는 감각 조율
            const leafAngle = branchAngle + (Math.random() - 0.5) * 1.2;
            oCtx.ellipse(x, y, radiusX, radiusY, leafAngle, 0, Math.PI * 2);
            oCtx.fill();
            oCtx.restore();
        }

        // 재귀적으로 트리 구조의 가지를 그리는 함수
        function growBranch(startX, startY, parentAngle, depth, startWidth, isLeft) {
            if (depth > maxDepth) return;

            let x = startX;
            let y = startY;
            let angle = parentAngle;
            let currentWidth = startWidth;

            const segmentCount = segmentCounts[depth];
            const baseLength = getSegmentLength(depth);

            // 화면 경계 및 중앙 텍스트 영역과의 안전 거리 설정
            const minX = 20;
            const maxX = isLeft ? Math.max(width * 0.25, (width - 1040) / 2 + 100) : width - 20;
            const rightMinX = isLeft ? 20 : Math.min(width * 0.75, width - ((width - 1040) / 2 + 100));

            for (let i = 0; i < segmentCount; i++) {
                if (y <= 50) break; // 최상단 영역 근접 시 중단

                const length = baseLength * (0.85 + Math.random() * 0.3);

                // 자연스러운 유기적인 미세 떨림(wobble) 추가
                angle += (Math.random() - 0.5) * 0.08;

                // 스무스한 proportional steering 힘을 이용한 경계선 및 텍스트 영역 회피
                if (isLeft) {
                    if (x > maxX) {
                        const steering = (x - maxX) * 0.003;
                        angle -= steering;
                    } else if (x < minX) {
                        const steering = (minX - x) * 0.003;
                        angle += steering;
                    }
                } else {
                    if (x < rightMinX) {
                        const steering = (rightMinX - x) * 0.003;
                        angle += steering;
                    } else if (x > maxX) {
                        const steering = (x - maxX) * 0.003;
                        angle -= steering;
                    }
                }

                let nextX = x + Math.cos(angle) * length;
                let nextY = y + Math.sin(angle) * length;

                // 캔버스에 선 그리기
                oCtx.beginPath();
                oCtx.moveTo(x, y);
                oCtx.lineTo(nextX, nextY);
                oCtx.lineWidth = currentWidth;
                oCtx.strokeStyle = branchColor;
                oCtx.lineCap = 'round';
                oCtx.stroke();

                // 말단 가지(마지막 2단계 깊이)에 무작위로 나뭇잎 생성 (가지와 겹치지 않게 오프셋 적용)
                if (depth >= maxDepth - 1) {
                    const leafProb = depth === maxDepth ? 0.75 : 0.35;
                    if (Math.random() < leafProb) {
                        const count = Math.floor(1 + Math.random() * 2); // 1~2개 잎사귀
                        for (let l = 0; l < count; l++) {
                            let leafX, leafY;
                            const dist = currentWidth / 2 + 10 + Math.random() * 6; // 가지 두께 + 여유 마진

                            if (Math.random() < 0.4) {
                                // 가지 끝 진행 방향 연장선에 배치
                                leafX = nextX + Math.cos(angle) * dist;
                                leafY = nextY + Math.sin(angle) * dist;
                            } else {
                                // 가지의 좌/우 수직 방향으로 매달리게 배치
                                const side = Math.random() < 0.5 ? 1 : -1;
                                const perpAngle = angle + side * Math.PI / 2;
                                leafX = nextX + Math.cos(perpAngle) * dist;
                                leafY = nextY + Math.sin(perpAngle) * dist;
                            }
                            drawLeaf(leafX, leafY, angle);
                        }
                    }
                }

                x = nextX;
                y = nextY;

                // 끝으로 갈수록 자연스럽게 가늘어지도록 설정
                currentWidth *= 0.95;
            }

            // 대칭 구조의 프랙탈 가지 분할 (Symmetric Branching)
            if (depth < maxDepth) {
                const childWidth = currentWidth * 0.75;
                // 최소 20도에서 최대 28도 사이의 대칭 분지 각도 적용
                const splitAngle = (20 + Math.random() * 8) * Math.PI / 180;

                const leftChildAngle = angle - splitAngle;
                const rightChildAngle = angle + splitAngle;

                growBranch(x, y, leftChildAngle, depth + 1, childWidth, isLeft);
                growBranch(x, y, rightChildAngle, depth + 1, childWidth, isLeft);
            }
        }

        const leftStart = Math.max(40, Math.min(110, (width - 1040) / 6.0));

        // 왼쪽 메인 트리
        growBranch(leftStart, height, -Math.PI / 2, 0, 25.0, true);

        // 오른쪽 메인 트리
        const rightStart = width - leftStart;
        growBranch(rightStart, height, -Math.PI / 2, 0, 25.0, false);

        // 그라데이션 마스킹
        const grad = oCtx.createLinearGradient(0, height, 0, 100);
        grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
        grad.addColorStop(0.15, 'rgba(0, 0, 0, 1.0)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

        oCtx.globalCompositeOperation = 'destination-in';
        oCtx.fillStyle = grad;
        oCtx.fillRect(0, 0, width, height);

        // 오프스크린 드로잉 결과를 메인 캔버스에 그리기
        ctx.drawImage(offscreen, 0, 0);
    }

    // 5. 나뭇가지 렌더링 이벤트 바인딩
    window.addEventListener('load', drawBranches);

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(drawBranches, 150);
    });

    // 초기화 직후 실행 시 문서 높이 계산 오차 보정을 위한 타이밍 조절 실행
    setTimeout(drawBranches, 100);
});