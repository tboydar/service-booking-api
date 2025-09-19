/**
 * @swagger
 * /services:
 *   get:
 *     summary: 獲取所有服務列表
 *     description: 獲取系統中所有可用的服務項目（公開 API）
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 頁碼
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 每頁數量
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 是否只顯示啟用的服務
 *     responses:
 *       200:
 *         description: 成功獲取服務列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     services:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Service'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 */

/**
 * @swagger
 * /services/{id}:
 *   get:
 *     summary: 根據 ID 獲取服務詳情
 *     description: 獲取特定服務的詳細資訊
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 服務 ID
 *     responses:
 *       200:
 *         description: 成功獲取服務詳情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       404:
 *         description: 服務不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /services:
 *   post:
 *     summary: 創建新服務
 *     description: 創建新的服務項目（需要管理員權限）
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - duration
 *               - price
 *               - maxCapacity
 *             properties:
 *               name:
 *                 type: string
 *                 example: "瑜伽課程"
 *               description:
 *                 type: string
 *                 example: "放鬆身心的瑜伽課程"
 *               duration:
 *                 type: integer
 *                 minimum: 1
 *                 example: 60
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 500
 *               maxCapacity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 10
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: 服務創建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       401:
 *         description: 未授權
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: 請求參數錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /services/{id}:
 *   put:
 *     summary: 更新服務資訊
 *     description: 更新現有服務的資訊（需要管理員權限）
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 服務 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: integer
 *                 minimum: 1
 *               price:
 *                 type: number
 *                 minimum: 0
 *               maxCapacity:
 *                 type: integer
 *                 minimum: 1
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 服務更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Service'
 *       401:
 *         description: 未授權
 *       404:
 *         description: 服務不存在
 */

/**
 * @swagger
 * /services/{id}:
 *   delete:
 *     summary: 刪除服務
 *     description: 刪除指定的服務項目（需要管理員權限）
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 服務 ID
 *     responses:
 *       200:
 *         description: 服務刪除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "服務刪除成功"
 *       401:
 *         description: 未授權
 *       404:
 *         description: 服務不存在
 */

// 這個檔案只包含 Swagger 註解，實際的控制器代碼在 service-controller.ts