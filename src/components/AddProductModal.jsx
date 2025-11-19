import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import './AddProductModal.css';

const defaultImages = [
  "https://images.unsplash.com/photo-1760287363699-a08d553fb8a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBmYXNoaW9uJTIwcHJvZHVjdHxlbnwxfHx8fDE3NjM1NDM3OTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1589270216117-7972b3082c7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwY2xvdGhpbmclMjBzdHlsZXxlbnwxfHx8fDE3NjM1NDM4MDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1670946838999-5809cb066126?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMHdoaXRlJTIwcHJvZHVjdHxlbnwxfHx8fDE3NjM1NDM4MDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1632773004171-02bc1c4a726a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcHBhcmVsJTIwZGVzaWdufGVufDF8fHx8MTc2MzU0MzgwMHww&ixlib=rb-4.1.0&q=80&w=1080"
];

export function AddProductModal({ open, onOpenChange, onSubmit }) {
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    typeId: '',
    isPreorder: false,
    preorderDays: 0,
    isActive: true
  });

  const [media, setMedia] = useState([]);
  const [errors, setErrors] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.productId.trim()) newErrors.productId = 'Product ID is required';
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Price is required and must be greater than 0';
    if (!formData.categoryId.trim()) newErrors.categoryId = 'Category ID is required';
    if (!formData.typeId.trim()) newErrors.typeId = 'Type ID is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newMedia = [];
      Array.from(files).forEach((file, index) => {
        const url = URL.createObjectURL(file);
        newMedia.push({
          mediaId: `MEDIA-${media.length + index + 1}`,
          mediaUrl: url,
          mediaType: 'image',
          mediaOrder: media.length + index + 1
        });
      });
      setMedia([...media, ...newMedia]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const newMedia = [];
      Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          newMedia.push({
            mediaId: `MEDIA-${media.length + index + 1}`,
            mediaUrl: url,
            mediaType: 'image',
            mediaOrder: media.length + index + 1
          });
        }
      });
      setMedia([...media, ...newMedia]);
    }
  };

  const removeImage = (index) => {
    const newMedia = media.filter((_, i) => i !== index);
    setMedia(newMedia);
  };

  const loadDefaultImages = () => {
    const defaultMedia = defaultImages.map((url, index) => ({
      mediaId: `MEDIA-${index + 1}`,
      mediaUrl: url,
      mediaType: 'image',
      mediaOrder: index + 1
    }));
    setMedia(defaultMedia);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare the request body according to API specification
      const requestBody = {
        productId: formData.productId,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        typeId: formData.typeId,
        isPreorder: formData.isPreorder,
        isActive: formData.isActive
      };

      console.log('Sending request to create product:', requestBody);

      const response = await fetch('http://localhost:8080/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const createdProduct = await response.json();
      console.log('Product created successfully:', createdProduct);

      // Call the onSubmit callback with the created product data
      if (onSubmit) {
        const formattedData = {
          product: createdProduct,
          media: media
        };
        onSubmit(formattedData);
      }

      // Reset form
      setFormData({
        productId: '',
        name: '',
        description: '',
        price: 0,
        categoryId: '',
        typeId: '',
        isPreorder: false,
        preorderDays: 0,
        isActive: true
      });
      setErrors({});
      setMedia([]);
      onOpenChange(false);
      
      // Show success message
      alert('Sản phẩm đã được tạo thành công!');
      
    } catch (error) {
      console.error('Error creating product:', error);
      alert(`Lỗi tạo sản phẩm: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="add-product-modal fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      ></div>

      {/* Modal */}
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-black text-white px-6 py-4 flex items-center justify-between border-b border-white/10">
          <h2>Create New Product</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="hover:bg-white/10 p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Product ID */}
              <div>
                <label className="block text-black mb-2">
                  Product ID *
                </label>
                <input
                  type="text"
                  value={formData.productId}
                  onChange={(e) => handleInputChange('productId', e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 focus:border-black focus:outline-none transition-colors"
                  placeholder="123"
                />
                {errors.productId && (
                  <p className="text-red-600 mt-1">{errors.productId}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-black mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 focus:border-black focus:outline-none transition-colors"
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="text-red-600 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-black mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-neutral-300 focus:border-black focus:outline-none transition-colors resize-none"
                  placeholder="Enter product description"
                />
                {errors.description && (
                  <p className="text-red-600 mt-1">{errors.description}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-black mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-neutral-300 focus:border-black focus:outline-none transition-colors"
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-red-600 mt-1">{errors.price}</p>
                )}
              </div>

              {/* Category ID */}
              <div>
                <label className="block text-black mb-2">
                  Category ID *
                </label>
                <input
                  type="text"
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 focus:border-black focus:outline-none transition-colors"
                  placeholder="CAT045"
                />
                {errors.categoryId && (
                  <p className="text-red-600 mt-1">{errors.categoryId}</p>
                )}
              </div>

              {/* Type ID */}
              <div>
                <label className="block text-black mb-2">
                  Type ID *
                </label>
                <input
                  type="text"
                  value={formData.typeId}
                  onChange={(e) => handleInputChange('typeId', e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 focus:border-black focus:outline-none transition-colors"
                  placeholder="Enter type ID"
                />
                {errors.typeId && (
                  <p className="text-red-600 mt-1">{errors.typeId}</p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Preorder Settings */}
              <div className="border border-neutral-300 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="isPreorder"
                    checked={formData.isPreorder}
                    onChange={(e) => handleInputChange('isPreorder', e.target.checked)}
                    className="w-5 h-5 accent-black"
                  />
                  <label htmlFor="isPreorder" className="text-black cursor-pointer">
                    Enable Preorder
                  </label>
                </div>

                {formData.isPreorder && (
                  <div>
                    <label className="block text-black mb-2">
                      Preorder Days
                    </label>
                    <input
                      type="number"
                      value={formData.preorderDays}
                      onChange={(e) => handleInputChange('preorderDays', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-neutral-300 focus:border-black focus:outline-none transition-colors"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                )}
              </div>

              {/* Active Status */}
              <div className="border border-neutral-300 p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="w-5 h-5 accent-black"
                  />
                  <label htmlFor="isActive" className="text-black cursor-pointer">
                    Active Product
                  </label>
                </div>
              </div>

              {/* Product Images */}
              <div>
                <label className="block text-black mb-2">
                  Product Images
                </label>
                
                {/* Upload Section */}
                <div className="mb-4">
                  <label 
                    htmlFor="image-upload" 
                    className={`flex items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed transition-colors cursor-pointer ${
                      isDragOver 
                        ? 'border-black bg-neutral-200' 
                        : 'border-neutral-300 bg-neutral-50 hover:border-black hover:bg-neutral-100'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-6 h-6 text-neutral-600" />
                    <span className="text-neutral-700">
                      {isDragOver ? 'Drop images here' : 'Click to upload images or drag and drop'}
                    </span>
                    <input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Default Images */}
                {media.length === 0 && (
                  <div className="mb-4">
                    <p className="text-neutral-600 mb-3">Or use default images:</p>
                    <button
                      type="button"
                      onClick={loadDefaultImages}
                      className="px-4 py-2 bg-neutral-100 text-black border border-neutral-300 hover:bg-neutral-200 transition-colors"
                    >
                      Load Default Images
                    </button>
                  </div>
                )}

                {/* Image Grid */}
                {media.length > 0 && (
                  <>
                    <p className="text-neutral-600 mb-3">Hover over images to see removal options</p>
                    <div className="grid grid-cols-2 gap-3">
                      {media.map((item, index) => (
                        <div
                          key={item.mediaId}
                          className="relative aspect-square group overflow-hidden ring-1 ring-neutral-300"
                        >
                          <ImageWithFallback
                            src={item.mediaUrl}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Overlay with actions */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all">
                            <div className="absolute top-2 right-2 flex gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(index);
                                }}
                                className="bg-white text-black p-2 hover:bg-red-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove image"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-8 py-3 border border-neutral-300 text-black hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 text-white transition-colors ${
                isSubmitting 
                  ? 'bg-neutral-400 cursor-not-allowed' 
                  : 'bg-black hover:bg-neutral-800'
              }`}
            >
              {isSubmitting ? 'Đang tạo...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}