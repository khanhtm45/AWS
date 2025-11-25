import React, { useEffect, useState } from 'react';
import './ProductModal.css';

export function ProductModal({ isOpen, onClose, onSubmit }) {
  const [step, setStep] = useState(1); // 1: Create Product, 2: Add Variants
  const [createdProductId, setCreatedProductId] = useState(null);
  const [categories, setCategories] = useState([]); // State for categories from API
  
  const [formData, setFormData] = React.useState({
    productId: '',
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    isPreorder: false,
    preorderDays: 0,
    images: [] // Add images array
  });

  // Variants state for step 2
  const [variants, setVariants] = useState([
    {
      variantId: `variant-${Date.now()}`,
      variantAttributes: { color: '' },
      variantPrice: 0
    }
  ]);

  const [errors, setErrors] = React.useState({});

  // Color presets
  const COLOR_PRESETS = [
    { value: "Đỏ", label: "Đỏ", hex: "#EF4444" },
    { value: "Xanh dương", label: "Xanh dương", hex: "#3B82F6" },
    { value: "Xanh lá", label: "Xanh lá", hex: "#10B981" },
    { value: "Vàng", label: "Vàng", hex: "#F59E0B" },
    { value: "Đen", label: "Đen", hex: "#000000" },
    { value: "Trắng", label: "Trắng", hex: "#FFFFFF" },
    { value: "Hồng", label: "Hồng", hex: "#EC4899" },
    { value: "Tím", label: "Tím", hex: "A855F7" },
    { value: "Cam", label: "Cam", hex: "#F97316" },
    { value: "Nâu", label: "Nâu", hex: "#92400E" }
  ];

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal is closed
      setStep(1);
      setCreatedProductId(null);
      setFormData({
        productId: '',
        name: '',
        description: '',
        price: 0,
        categoryId: '',
        isPreorder: false,
        preorderDays: 0,
        images: [] // Reset images
      });
      setVariants([
        {
          variantId: `variant-${Date.now()}`,
          variantAttributes: { color: '' },
          variantPrice: 0
        }
      ]);
      setErrors({});
    } else {
      // Fetch categories when modal opens
      fetchCategories();
    }
  }, [isOpen]);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      console.log('📋 Fetching categories from API...');
      const res = await fetch('http://localhost:8080/api/categories');
      
      if (!res.ok) {
        console.error('Lỗi gọi API categories, status:', res.status);
        return;
      }
      
      const data = await res.json();
      console.log('✅ Loaded', data.length, 'categories');
      setCategories(data);
    } catch (error) {
      console.error('Không thể load categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Variant management functions
  const addVariant = () => {
    setVariants([
      ...variants,
      {
        variantId: `variant-${Date.now()}`,
        variantAttributes: { color: '' },
        variantPrice: formData.price
      }
    ]);
  };

  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...variants];
    if (field === 'color') {
      newVariants[index].variantAttributes.color = value;
    } else {
      newVariants[index][field] = value;
    }
    setVariants(newVariants);
  };

  // Image handling functions
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Check total images limit
    if (formData.images.length + files.length > 10) {
      alert('Tối đa 10 ảnh. Vui lòng chọn ít hơn.');
      e.target.value = '';
      return;
    }
    
    // Show loading state
    setErrors(prev => ({
      ...prev,
      images: 'Đang upload ảnh...'
    }));
    
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          console.warn(`File ${file.name} không phải là ảnh`);
          continue;
        }
        
        await uploadSingleImageToS3(file);
      }
      
      // Clear loading state
      setErrors(prev => ({
        ...prev,
        images: ''
      }));
      
    } catch (error) {
      console.error('Error uploading images:', error);
      setErrors(prev => ({
        ...prev,
        images: `Lỗi upload: ${error.message}`
      }));
    }
    
    // Reset input
    e.target.value = '';
  };

  // New function to handle S3 upload
  const uploadSingleImageToS3 = async (file) => {
    try {
      // Step 1: Get presigned URL from backend
      console.log('🚀 Step 1: Getting presigned URL...');
      
      const presignedResponse = await fetch('http://localhost:8080/api/s3/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: file.name,
          folderPath: 'products/images',
          contentType: file.type,
          expirationMinutes: 5
        })
      });
      
      if (!presignedResponse.ok) {
        const errorText = await presignedResponse.text();
        throw new Error(`Failed to get presigned URL: ${presignedResponse.status} - ${errorText}`);
      }
      
      const { presignedUrl, publicUrl, s3Key } = await presignedResponse.json();
      console.log('✅ Step 1: Got presigned URL successfully');
      console.log('S3 Key:', s3Key);
      console.log('Public URL:', publicUrl);
      
      // Step 2: Upload file to S3 using presigned URL
      console.log('📤 Step 2: Uploading to S3...');
      
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`S3 Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }
      
      console.log('✅ Step 2: File uploaded to S3 successfully!');
      
      // Step 3: Add to formData with S3 info
      const newImage = {
        id: Date.now() + Math.random(),
        file: file,
        url: publicUrl, // Use S3 public URL
        name: file.name,
        s3Key: s3Key, // Store S3 key for later deletion
        uploadedToS3: true // Flag to indicate it's on S3
      };
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImage]
      }));
      
      console.log('✅ Step 3: Image added to form data');
      
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const removeImage = async (imageId) => {
    const imageToRemove = formData.images.find(img => img.id === imageId);
    
    // Remove from UI first
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
    
    // If image was uploaded to S3, try to delete it
    if (imageToRemove && imageToRemove.uploadedToS3 && imageToRemove.s3Key) {
      try {
        console.log(`🗑️ Deleting S3 file: ${imageToRemove.s3Key}`);
        
        const deleteResponse = await fetch(
          `http://localhost:8080/api/s3/delete?s3Key=${encodeURIComponent(imageToRemove.s3Key)}`,
          {
            method: 'DELETE'
          }
        );
        
        if (deleteResponse.ok) {
          console.log('✅ S3 file deleted successfully');
        } else {
          console.warn('⚠️ Failed to delete S3 file, but removed from UI');
        }
      } catch (error) {
        console.warn('⚠️ Error deleting S3 file:', error);
        // Don't throw error, image already removed from UI
      }
    }
  };

  const moveImage = (fromIndex, toIndex) => {
    const newImages = [...formData.images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  // Handle product creation (step 1)
  const handleCreateProduct = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      // Show loading state
      setErrors(prev => ({
        ...prev,
        general: 'Đang tạo sản phẩm...'
      }));

      // Fix: Use correct field name 'name' instead of 'productName' and hardcode hidden fields
      const productPayload = {
        productId: formData.productId?.trim() || `PRODUCT_${Date.now()}`,
        name: formData.name?.trim() || '',
        description: formData.description?.trim() || '',
        price: Number(formData.price) || 0,
        categoryId: formData.categoryId?.trim() || '',
        // Hardcoded hidden fields with default values
        typeId: 'clothing',
        isPreorder: Boolean(formData.isPreorder),
        preorderDays: Number(formData.preorderDays) || 0,
        isActive: true,
        tags: []
      };

      // Validate required fields before sending
      if (!productPayload.productId || !productPayload.name || !productPayload.categoryId) {
        throw new Error('Thiếu thông tin bắt buộc: ID sản phẩm, tên sản phẩm, hoặc danh mục');
      }

      console.log('🚀 Step 1: Creating product with API...');
      console.log('API URL:', 'http://localhost:8080/api/products');
      console.log('Payload:', JSON.stringify(productPayload, null, 2));
      
      // Log hardcoded values
      console.log('🔒 Hardcoded values:');
      console.log('   typeId:', productPayload.typeId);
      console.log('   isActive:', productPayload.isActive);
      console.log('   tags:', productPayload.tags);

      // Call API with proper headers
      const response = await fetch('http://localhost:8080/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(productPayload)
      });

      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        // Handle specific error cases
        if (response.status === 400) {
          throw new Error(`Dữ liệu không hợp lệ: ${errorText}`);
        } else if (response.status === 409) {
          throw new Error(`Sản phẩm đã tồn tại: ${errorText}`);
        } else {
          throw new Error(`Lỗi server (${response.status}): ${errorText}`);
        }
      }

      const createdProduct = await response.json();
      console.log('✅ Product created successfully:', createdProduct);

      // Set the created product ID
      const productId = createdProduct.productId || productPayload.productId;
      setCreatedProductId(productId);

      // Initialize variants with base price
      setVariants([{
        variantId: `variant-${Date.now()}`,
        variantAttributes: { color: '' },
        variantPrice: productPayload.price
      }]);

      // Clear loading state
      setErrors(prev => ({
        ...prev,
        general: ''
      }));

      // Move to step 2
      setStep(2);
      
      console.log(`🎯 Ready for step 2 with Product ID: ${productId}`);
      
    } catch (error) {
      console.error('❌ Error creating product:', error);
      
      // Set user-friendly error message
      setErrors(prev => ({
        ...prev,
        general: error.message
      }));

      // Provide troubleshooting hints based on error type
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        console.log('💡 CORS/Network Issue Detected');
        console.log('   1. Check if backend is running on http://localhost:8080');
        console.log('   2. Verify CORS is configured properly in backend');
        console.log('   3. Try: curl -X POST http://localhost:8080/api/products');
      }
    }
  };

  // Handle variant creation (step 2)
  const handleCreateVariants = async () => {
    const validVariants = variants.filter(v => v.variantAttributes.color.trim() !== '');
    
    if (validVariants.length === 0) {
      alert('Vui lòng thêm ít nhất một màu sắc');
      return;
    }

    try {
      // Show loading state
      setErrors(prev => ({
        ...prev,
        variants: 'Đang tạo variants...'
      }));

      // Create variants for each color
      const createdVariants = [];
      
      for (let i = 0; i < validVariants.length; i++) {
        const variant = validVariants[i];
        
        const variantPayload = {
          variantId: `variant_${createdProductId}_${Date.now()}_${i}`,
          variantAttributes: {
            color: variant.variantAttributes.color,
            // Map other color variants if needed
            ...(validVariants.length > 1 && {
              [`colorOption${i + 1}`]: variant.variantAttributes.color
            })
          },
          variantPrice: variant.variantPrice || formData.price,
          sku: `SKU_${createdProductId}_${variant.variantAttributes.color.toUpperCase().replace(/\s+/g, '')}_${Date.now()}`,
          barcode: `BC_${createdProductId}_${Date.now()}_${i}`
        };

        console.log(`🚀 Creating variant ${i + 1}/${validVariants.length}:`, variantPayload);
        console.log(`📍 API URL: http://localhost:8080/api/products/${createdProductId}/variants`);
        
        // Call API to create variant
        const variantResponse = await fetch(`http://localhost:8080/api/products/${createdProductId}/variants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(variantPayload)
        });

        console.log(`📡 Response Status: ${variantResponse.status} ${variantResponse.statusText}`);
        
        if (!variantResponse.ok) {
          const errorText = await variantResponse.text();
          console.error('❌ Variant creation failed:', errorText);
          throw new Error(`Failed to create variant ${i + 1}: ${variantResponse.status} - ${errorText}`);
        }

        const createdVariant = await variantResponse.json();
        console.log(`✅ Variant ${i + 1} created successfully:`, createdVariant);
        createdVariants.push(createdVariant);
      }

      // Clear loading state
      setErrors(prev => ({
        ...prev,
        variants: ''
      }));

      console.log(`🎉 All ${createdVariants.length} variants created successfully!`);
      
      // Create final product data with S3 images and API-created variants
      const finalProductData = {
        ...formData,
        colors: validVariants.map(v => v.variantAttributes.color),
        variants: createdVariants, // Include API response variants
        id: Date.now(),
        // Use first S3 image as main image, fallback to placeholder
        image: formData.images.length > 0 ? formData.images[0].url : '/api/placeholder/60/60',
        // Include all S3 images with metadata
        images: formData.images.map(img => ({
          id: img.id,
          url: img.url,
          name: img.name,
          isPrimary: img.id === formData.images[0]?.id,
          s3Key: img.s3Key, // Include S3 key for future management
          uploadedToS3: img.uploadedToS3
        }))
      };

      console.log('📊 Final product data with API variants:', finalProductData);

      // Call parent callback
      onSubmit(finalProductData);
      
    } catch (error) {
      console.error('❌ Error creating variants:', error);
      
      // Clear loading state and show error
      setErrors(prev => ({
        ...prev,
        variants: `Lỗi tạo variants: ${error.message}`
      }));
      
      // Show user-friendly error
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        alert('❌ Không thể kết nối đến server. Vui lòng kiểm tra:\n\n1. Backend có đang chạy trên port 8080?\n2. Kiểm tra CORS settings\n3. Product ID có tồn tại trong database?');
      } else if (error.message.includes('404')) {
        alert(`❌ Product với ID "${createdProductId}" không tồn tại trong database.\n\nVui lòng tạo product trước khi tạo variants.`);
      } else if (error.message.includes('400')) {
        alert('❌ Dữ liệu variants không hợp lệ. Vui lòng kiểm tra lại thông tin màu sắc.');
      } else {
        alert(`❌ Có lỗi xảy ra khi tạo variants:\n\n${error.message}\n\nVui lòng thử lại hoặc kiểm tra console để biết thêm chi tiết.`);
      }
    }
  };

  const isVariantsValid = () => {
    return variants.some(v => v.variantAttributes.color.trim() !== '');
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required field validations
    if (!formData.productId?.trim()) {
      newErrors.productId = 'Mã sản phẩm là bắt buộc';
    }
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Tên sản phẩm là bắt buộc';
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = 'Mô tả là bắt buộc';
    }
    
    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = 'Giá phải lớn hơn 0';
    }
    
    if (!formData.categoryId?.trim()) {
      newErrors.categoryId = 'Danh mục là bắt buộc';
    }
    
    // Preorder validation
    if (formData.isPreorder && (!formData.preorderDays || Number(formData.preorderDays) <= 0)) {
      newErrors.preorderDays = 'Số ngày đặt hàng trước phải lớn hơn 0';
    }

    // Optional: Images validation
    if (formData.images?.length > 10) {
      newErrors.images = 'Tối đa 10 ảnh';
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (step === 1) {
      handleCreateProduct();
    } else if (step === 2) {
      handleCreateVariants();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="product-modal-overlay">
      {/* Backdrop */}
      <div 
        className="product-modal-backdrop"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="product-modal-content">
        {/* Header */}
        <div className="product-modal-header">
          <div className="product-modal-header-content">
            <div className="product-modal-icon">
              <span className="text-white text-lg">📦</span>
            </div>
            <div>
              <h2 className="product-modal-title">
                {step === 1 ? 'Tạo sản phẩm mới' : 'Thêm màu sắc'}
              </h2>
              <p className="product-modal-subtitle">
                {step === 1 
                  ? 'Điền thông tin chi tiết sản phẩm quần áo' 
                  : `Thêm các biến thể màu sắc cho sản phẩm (ID: ${createdProductId})`
                }
              </p>
              <div className="step-indicator">
                Bước {step}/2
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="product-modal-close"
          >
            <span className="text-slate-600 text-xl">×</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="product-modal-form">
          <div className="product-modal-body">
            {step === 1 ? (
              // Step 1: Create Product
              <>
                {/* Product ID & Name Row */}
                <div className="product-modal-grid product-modal-grid-2">
                  <div>
                    <label className="product-modal-label">
                      <span className="inline mr-1">#</span>
                      Mã sản phẩm <span className="required">*</span>
                    </label>
                    <input
                      name="productId"
                      value={formData.productId}
                      onChange={handleInputChange}
                      type="text"
                      placeholder="VD: SP001"
                      className="product-modal-input"
                    />
                    {errors.productId && (
                      <p className="product-modal-error">{errors.productId}</p>
                    )}
                  </div>

                  <div>
                    <label className="product-modal-label">
                      Tên sản phẩm <span className="required">*</span>
                    </label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      type="text"
                      placeholder="VD: Áo thun cotton nam"
                      className="product-modal-input"
                    />
                    {errors.name && (
                      <p className="product-modal-error">{errors.name}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="product-modal-field">
                  <label className="product-modal-label">
                    Mô tả sản phẩm <span className="required">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Mô tả chi tiết về sản phẩm..."
                    className="product-modal-input product-modal-textarea"
                  />
                  {errors.description && (
                    <p className="product-modal-error">{errors.description}</p>
                  )}
                </div>

                {/* Price & Category Row */}
                <div className="product-modal-grid product-modal-grid-2">
                  <div>
                    <label className="product-modal-label">
                      <span className="inline mr-1">💰</span>
                      Giá <span className="required">*</span>
                    </label>
                    <input
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      type="number"
                      placeholder="0"
                      min="0"
                      className="product-modal-input"
                    />
                    {errors.price && (
                      <p className="product-modal-error">{errors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="product-modal-label">
                      Danh mục <span className="required">*</span>
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className="product-modal-input"
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map(category => (
                        <option key={category.categoryId} value={category.categoryId}>
                          {category.categoryName}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <p className="product-modal-error">{errors.categoryId}</p>
                    )}
                  </div>
                </div>

                {/* Preorder Section */}
                <div className="product-modal-preorder">
                  <div className="product-modal-checkbox-wrapper">
                    <input
                      name="isPreorder"
                      checked={formData.isPreorder}
                      onChange={handleInputChange}
                      type="checkbox"
                      id="isPreorder"
                      className="product-modal-checkbox"
                    />
                    <label htmlFor="isPreorder" className="product-modal-label" style={{marginBottom: 0}}>
                      <span>📅</span>
                      Đặt hàng trước
                    </label>
                  </div>
                  
                  {formData.isPreorder && (
                    <div className="product-modal-preorder-days">
                      <label className="product-modal-label">
                        Số ngày đặt trước
                      </label>
                      <input
                        name="preorderDays"
                        value={formData.preorderDays}
                        onChange={handleInputChange}
                        type="number"
                        placeholder="VD: 7"
                        min="1"
                        className="product-modal-input"
                        style={{maxWidth: '200px'}}
                      />
                      {errors.preorderDays && (
                        <p className="product-modal-error">{errors.preorderDays}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Image Upload Section */}
                <div className="product-modal-field">
                  <label className="product-modal-label">
                    <span className="inline mr-1">📷</span>
                    Hình ảnh sản phẩm
                  </label>
                  
                  {/* Upload Area */}
                  <div className="image-upload-area">
                    <input
                      type="file"
                      id="image-upload"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="image-upload-input"
                      disabled={errors.images === 'Đang upload ảnh...'}
                    />
                    <label htmlFor="image-upload" className="image-upload-label">
                      <div className="image-upload-content">
                        {errors.images === 'Đang upload ảnh...' ? (
                          <>
                            <span className="image-upload-icon">⏳</span>
                            <span className="image-upload-text">
                              Đang upload ảnh lên cloud...
                            </span>
                            <span className="image-upload-hint">
                              Vui lòng đợi trong giây lát
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="image-upload-icon">📁</span>
                            <span className="image-upload-text">
                              Chọn ảnh hoặc kéo thả vào đây
                            </span>
                            <span className="image-upload-hint">
                              Hỗ trợ: JPG, PNG, GIF (tối đa 10 ảnh) - Upload lên AWS S3
                            </span>
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Show upload error */}
                  {errors.images && errors.images !== 'Đang upload ảnh...' && (
                    <p className="product-modal-error">{errors.images}</p>
                  )}

                  {/* Image Preview Grid */}
                  {formData.images.length > 0 && (
                    <div className="image-preview-grid">
                      {formData.images.map((image, index) => (
                        <div key={image.id} className="image-preview-item">
                          <div className="image-preview-wrapper">
                            <img
                              src={image.url}
                              alt={`Product ${index + 1}`}
                              className="image-preview"
                            />
                            
                            {/* S3 Badge */}
                            {image.uploadedToS3 && (
                              <div className="s3-badge">
                                ☁️ S3
                              </div>
                            )}
                            
                            {/* Image Controls */}
                            <div className="image-controls">
                              {/* Move buttons */}
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => moveImage(index, index - 1)}
                                  className="image-control-btn move-left"
                                  title="Di chuyển trái"
                                >
                                  ←
                                </button>
                              )}
                              
                              {index < formData.images.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => moveImage(index, index + 1)}
                                  className="image-control-btn move-right"
                                  title="Di chuyển phải"
                                >
                                  →
                                </button>
                              )}
                              
                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => removeImage(image.id)}
                                className="image-control-btn remove"
                                title="Xóa ảnh"
                              >
                                🗑️
                              </button>
                            </div>

                            {/* Primary badge */}
                            {index === 0 && (
                              <div className="primary-image-badge">
                                Ảnh chính
                              </div>
                            )}
                          </div>
                          
                          {/* Image info */}
                          <div className="image-info">
                            <span className="image-name">{image.name}</span>
                            <span className="image-size">
                              {(image.file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            {image.uploadedToS3 && (
                              <span className="s3-info">📍 Stored on AWS S3</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Error display for step 1 */}
                {errors.general && (
                  <div className="step-error">
                    <p className="product-modal-error">{errors.general}</p>
                  </div>
                )}
              </>
            ) : (
              // Step 2: Add Variants
              <div className="variants-section">
              
                
                <div className="variants-container">
                  {variants.map((variant, index) => (
                    <div key={variant.variantId} className="variant-item">
                      {/* Header */}
                      <div className="variant-header">
                        <span className="variant-title">Biến thể {index + 1}</span>
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="remove-variant-btn"
                          >
                            🗑️
                          </button>
                        )}
                      </div>

                      {/* Color selection */}
                      <div className="color-selection">
                        <label className="product-modal-label">
                          Màu sắc <span className="required">*</span>
                        </label>
                        <div className="color-presets">
                          {COLOR_PRESETS.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => updateVariant(index, 'color', color.value)}
                              className={`color-preset-btn ${
                                variant.variantAttributes.color === color.value ? 'selected' : ''
                              }`}
                            >
                              <div
                                className="color-preview"
                                style={{ backgroundColor: color.hex }}
                              />
                              <span className="color-label">{color.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom color input */}
                      <div className="custom-color-input">
                        <div className="custom-color-wrapper">
                          <div className="custom-color-icon">
                            🎨
                          </div>
                          <input
                            type="text"
                            placeholder="Hoặc nhập màu tùy chỉnh (VD: Navy Blue, Xanh Navy...)"
                            value={
                              COLOR_PRESETS.find(c => c.value === variant.variantAttributes.color)
                                ? ''
                                : variant.variantAttributes.color
                            }
                            onChange={(e) => updateVariant(index, 'color', e.target.value)}
                            className="custom-color-input-field"
                          />
                          {variant.variantAttributes.color && !COLOR_PRESETS.find(c => c.value === variant.variantAttributes.color) && (
                            <div className="custom-color-display">
                              <span className="custom-color-text">{variant.variantAttributes.color}</span>
                            </div>
                          )}
                        </div>
                        
                      </div>

                      {/* Variant price - HIDDEN
                      <div className="variant-price">
                        <label className="product-modal-label">
                          Giá riêng (tùy chọn)
                        </label>
                        <input
                          type="number"
                          placeholder={`Giá gốc: ${formData.price}`}
                          value={variant.variantPrice || ''}
                          onChange={(e) => updateVariant(index, 'variantPrice', Number(e.target.value))}
                          className="product-modal-input"
                        />
                      </div>
                      */}
                    </div>
                  ))}
                </div>

                {/* Add variant button */}
                <button
                  type="button"
                  onClick={addVariant}
                  className="add-variant-btn"
                  disabled={errors.variants === 'Đang tạo variants...'}
                >
                  {errors.variants === 'Đang tạo variants...' ? (
                    <>⏳ Đang tạo variants...</>
                  ) : (
                    <>➕ Thêm biến thể màu sắc</>
                  )}
                </button>

                {/* Show variants error */}
                {errors.variants && errors.variants !== 'Đang tạo variants...' && (
                  <p className="product-modal-error" style={{marginTop: '16px'}}>
                    {errors.variants}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="product-modal-footer">
            {step === 1 ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="product-modal-btn product-modal-btn-cancel"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="product-modal-btn product-modal-btn-submit"
                  disabled={!formData.name || !formData.price || !formData.categoryId}
                >
                  Tiếp tục → Thêm Màu Sắc
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="product-modal-btn product-modal-btn-back"
                  disabled={errors.variants === 'Đang tạo variants...'}
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="product-modal-btn product-modal-btn-cancel"
                  disabled={errors.variants === 'Đang tạo variants...'}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="product-modal-btn product-modal-btn-submit"
                  disabled={!isVariantsValid() || errors.variants === 'Đang tạo variants...'}
                >
                  {errors.variants === 'Đang tạo variants...' ? (
                    <>⏳ Đang tạo variants...</>
                  ) : (
                    <>Hoàn thành</>
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}