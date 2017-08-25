const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const getTitleSlug = require('../helpers').getTitleSlug;

const articleShema = new Schema({
  created: {
    type: Date,
    default: Date.now,
  },
  slug: String,
  title: {
    type: String,
    trim: true,
    required: '请输入标题！',
  },
  tags: [{ type: String, ref: 'Tag' }],
  category: {
    type: Schema.Types.ObjectId,
    required: '请选择分类!',
    ref: 'Category',
  },
  content: {
    type: String,
    required: '请输入文章内容！',
  },
});

function autopopulate(next) {
  this.populate({ path: 'tagIds' });
  next();
}

async function setArticleSlug(next) {
  if (!this.isModified('title')) {
    // if title doesn't modified, skip it!
    next();
    return;
  }

  // get the new slug
  this.slug = await getTitleSlug(this.title);
  // find a slugs that has the title title-1 pattern
  const slugRegEx = new RegExp(`^(${this.slug})(((-/d*)$)?)$`, 'i');
  const articlesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (articlesWithSlug.length) {
    this.slug = `${this.slug}-${articlesWithSlug.length + 1}`;
  }
  next();
}

// articleShema.virtual('tags', {
//   ref: 'Tag',
//   localField: 'tags',
//   foreignField: 'name',
// });

articleShema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

articleShema.pre('save', setArticleSlug);

articleShema.pre('find', autopopulate);
articleShema.pre('findOne', autopopulate);

module.exports = mongoose.model('Article', articleShema);